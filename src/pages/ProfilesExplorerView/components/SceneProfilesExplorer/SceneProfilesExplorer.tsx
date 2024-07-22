import { css } from '@emotion/css';
import { dateTimeParse, GrafanaTheme2 } from '@grafana/data';
import {
  DataSourceVariable,
  EmbeddedSceneState,
  getUrlSyncManager,
  SceneComponentProps,
  sceneGraph,
  SceneObject,
  SceneObjectBase,
  SceneObjectUrlSyncConfig,
  SceneObjectUrlValues,
  SceneRefreshPicker,
  SceneTimePicker,
  SceneTimeRange,
  sceneUtils,
  SceneVariable,
  SceneVariableSet,
  SplitLayout,
} from '@grafana/scenes';
import { IconButton, InlineLabel, useStyles2 } from '@grafana/ui';
import { useResizeObserver } from '@react-aria/utils';
import { displayError, displaySuccess } from '@shared/domain/displayStatus';
import { reportInteraction } from '@shared/domain/reportInteraction';
import { VersionInfoTooltip } from '@shared/ui/VersionInfoTooltip';
import React, { useRef, useState } from 'react';

import { SceneExploreAllServices } from '../../components/SceneExploreAllServices/SceneExploreAllServices';
import { SceneExploreFavorites } from '../../components/SceneExploreFavorites/SceneExploreFavorites';
import { SceneExploreFlameGraph } from '../../components/SceneExploreFlameGraph/SceneExploreFlameGraph';
import { SceneExploreServiceLabels } from '../../components/SceneExploreServiceLabels/SceneExploreServiceLabels';
import { SceneExploreServiceProfileTypes } from '../../components/SceneExploreServiceProfileTypes/SceneExploreServiceProfileTypes';
import { EventViewServiceFlameGraph } from '../../domain/events/EventViewServiceFlameGraph';
import { EventViewServiceLabels } from '../../domain/events/EventViewServiceLabels';
import { EventViewServiceProfiles } from '../../domain/events/EventViewServiceProfiles';
import { FiltersVariable } from '../../domain/variables/FiltersVariable/FiltersVariable';
import { GroupByVariable } from '../../domain/variables/GroupByVariable/GroupByVariable';
import { ProfileMetricVariable } from '../../domain/variables/ProfileMetricVariable';
import { ProfilesDataSourceVariable } from '../../domain/variables/ProfilesDataSourceVariable';
import { ServiceNameVariable } from '../../domain/variables/ServiceNameVariable';
import { findSceneObjectByClass } from '../../helpers/findSceneObjectByClass';
import { FavoritesDataSource } from '../../infrastructure/favorites/FavoritesDataSource';
import { LabelsDataSource } from '../../infrastructure/labels/LabelsDataSource';
import { SeriesDataSource } from '../../infrastructure/series/SeriesDataSource';
import { SceneLayoutSwitcher } from '../SceneByVariableRepeaterGrid/components/SceneLayoutSwitcher';
import { SceneNoDataSwitcher } from '../SceneByVariableRepeaterGrid/components/SceneNoDataSwitcher';
import { ScenePanelTypeSwitcher } from '../SceneByVariableRepeaterGrid/components/ScenePanelTypeSwitcher';
import { SceneQuickFilter } from '../SceneByVariableRepeaterGrid/components/SceneQuickFilter';
import { GridItemData } from '../SceneByVariableRepeaterGrid/types/GridItemData';
import { ExplorationTypeSelector, ExplorationTypeSelectorProps } from './ui/ExplorationTypeSelector';

export interface SceneProfilesExplorerState extends Partial<EmbeddedSceneState> {
  explorationType?: ExplorationType;
  body?: SplitLayout;
  gridControls: Array<SceneObject & { key?: string }>;
}

export enum ExplorationType {
  ALL_SERVICES = 'all',
  PROFILE_TYPES = 'profiles',
  LABELS = 'labels',
  FLAME_GRAPH = 'flame-graph',
  FAVORITES = 'favorites',
}

export class SceneProfilesExplorer extends SceneObjectBase<SceneProfilesExplorerState> {
  static EXPLORATION_TYPE_OPTIONS = [
    {
      value: ExplorationType.ALL_SERVICES,
      label: 'All services',
      description: 'Overview of all services, for any given profile type',
    },
    {
      value: ExplorationType.PROFILE_TYPES,
      label: 'Profile types',
      description: 'Overview of all the profile types for a single service',
    },
    {
      value: ExplorationType.LABELS,
      label: 'Labels',
      description: 'Single service label exploration and filtering',
    },
    {
      value: ExplorationType.FLAME_GRAPH,
      label: 'Flame graph',
      description: 'Single service flame graph',
    },
    {
      value: ExplorationType.FAVORITES,
      label: 'Favorites',
      description: 'Overview of favorited visualizations',
    },
  ];

  static DEFAULT_EXPLORATION_TYPE = SceneProfilesExplorer.EXPLORATION_TYPE_OPTIONS[0].value;

  protected _urlSync = new SceneObjectUrlSyncConfig(this, { keys: ['explorationType'] });

  constructor() {
    super({
      key: 'profiles-explorer',
      explorationType: undefined,
      body: undefined,
      $timeRange: new SceneTimeRange({}),
      $variables: new SceneVariableSet({
        // in order to sync with the URL and...
        // ...because of a limitation of the Scenes library, we have to create them now, once, and not every time we set a new exploration type
        // also, we prevent re-creating all variables when switching exploration type, which would lead to unecessary work and layout shifts in the UI
        // (because values would be empty before loading, then populated after fetched)
        // see setExplorationType() for dynamic updates
        variables: [
          new ProfilesDataSourceVariable(),
          new ServiceNameVariable(),
          new ProfileMetricVariable(),
          new FiltersVariable(),
          new GroupByVariable(),
        ],
      }),
      controls: [new SceneTimePicker({ isOnCanvas: true }), new SceneRefreshPicker({ isOnCanvas: true })],
      // these scenes sync with the URL so...
      // ...because of a limitation of the Scenes library, we have to create them now, once, and not every time we set a new exploration type
      gridControls: [
        new SceneQuickFilter({ placeholder: '' }),
        new ScenePanelTypeSwitcher(),
        new SceneLayoutSwitcher(),
        new SceneNoDataSwitcher(),
      ],
    });

    getUrlSyncManager().initSync(this);

    this.registerRuntimeDataSources();

    this.addActivationHandler(this.onActivate.bind(this));
  }

  onActivate() {
    const eventsSub = this.subscribeToEvents();

    const explorationType = Object.values(ExplorationType).includes(this.state.explorationType as ExplorationType)
      ? (this.state.explorationType as ExplorationType)
      : SceneProfilesExplorer.DEFAULT_EXPLORATION_TYPE;

    this.setExplorationType(explorationType);

    return () => {
      eventsSub.unsubscribe();
    };
  }

  getUrlState() {
    return {
      explorationType: this.state.explorationType,
    };
  }

  updateFromUrl(values: SceneObjectUrlValues) {
    const stateUpdate: Partial<SceneProfilesExplorerState> = {};

    if (typeof values.explorationType === 'string' && values.explorationType !== this.state.explorationType) {
      stateUpdate.explorationType = values.explorationType as ExplorationType;
    }

    this.setState(stateUpdate);
  }

  registerRuntimeDataSources() {
    // wrapped in a try-catch to prevent error when registered twice, which can easily happen if we go back & forth to the Profiles Explorer page
    try {
      sceneUtils.registerRuntimeDataSource({ dataSource: new SeriesDataSource() });
      sceneUtils.registerRuntimeDataSource({ dataSource: new FavoritesDataSource() });
      sceneUtils.registerRuntimeDataSource({ dataSource: new LabelsDataSource() });
    } catch (error) {
      const { message } = error as Error;

      if (!/A runtime data source with uid (.+) has already been registered/.test(message)) {
        displayError(error, [
          'Fail to register all the runtime data sources!',
          'The application cannot work as expected, please try reloading the page or if the problem persists, contact your organization admin.',
        ]);
      }
    }
  }

  subscribeToEvents() {
    const profilesSub = this.subscribeToEvent(EventViewServiceProfiles, (event) => {
      (findSceneObjectByClass(this, SceneQuickFilter) as SceneQuickFilter)?.clear();

      this.setExplorationType(ExplorationType.PROFILE_TYPES, event.payload.item);
    });

    const labelsSub = this.subscribeToEvent(EventViewServiceLabels, (event) => {
      (findSceneObjectByClass(this, SceneQuickFilter) as SceneQuickFilter)?.clear();

      this.setExplorationType(ExplorationType.LABELS, event.payload.item);
    });

    const flameGraphSub = this.subscribeToEvent(EventViewServiceFlameGraph, (event) => {
      (findSceneObjectByClass(this, SceneQuickFilter) as SceneQuickFilter)?.clear();

      this.setExplorationType(ExplorationType.FLAME_GRAPH, event.payload.item);
    });

    return {
      unsubscribe() {
        flameGraphSub.unsubscribe();
        labelsSub.unsubscribe();
        profilesSub.unsubscribe();
      },
    };
  }

  setExplorationType(explorationType: ExplorationType, gridItemData?: GridItemData) {
    this.setState({
      explorationType,
      body: this.buildBodyScene(explorationType),
    });

    if (gridItemData) {
      this.updateVariablesAndControls(gridItemData);
    }
  }

  buildBodyScene(explorationType: ExplorationType) {
    let primary;

    switch (explorationType) {
      case ExplorationType.PROFILE_TYPES:
        primary = new SceneExploreServiceProfileTypes();

        this.updateQuickFilterPlaceholder('Search profile types (comma-separated regexes are supported)');
        break;

      case ExplorationType.LABELS:
        primary = new SceneExploreServiceLabels();
        break;

      case ExplorationType.FLAME_GRAPH:
        primary = new SceneExploreFlameGraph();
        break;

      case ExplorationType.FAVORITES:
        primary = new SceneExploreFavorites();

        this.updateQuickFilterPlaceholder('Search favorites (comma-separated regexes are supported)');
        break;

      case ExplorationType.ALL_SERVICES:
      default:
        primary = new SceneExploreAllServices();

        this.updateQuickFilterPlaceholder('Search services (comma-separated regexes are supported)');
    }

    return new SplitLayout({
      direction: 'column',
      primary,
    });
  }

  updateQuickFilterPlaceholder(newPlaceholder: string) {
    (this.state.gridControls[0] as SceneQuickFilter).setPlaceholder(newPlaceholder);
  }

  // eslint-disable-next-line sonarjs/cognitive-complexity
  updateVariablesAndControls(item: GridItemData) {
    const [, serviceNameVariable, profileMetricVariable, filtersVariable, groupByVariable] = this.state.$variables!
      .state.variables as [
      DataSourceVariable,
      ServiceNameVariable,
      ProfileMetricVariable,
      FiltersVariable,
      GroupByVariable
    ];

    const { queryRunnerParams, panelType } = item;
    const { serviceName, profileMetricId, filters, groupBy } = queryRunnerParams;

    if (serviceName) {
      serviceNameVariable.changeValueTo(serviceName);
    }

    if (profileMetricId) {
      profileMetricVariable.changeValueTo(profileMetricId);
    }

    if (filters) {
      filtersVariable.setState({ filters });
    }

    if (groupBy?.label) {
      // because (to the contrary of the "Series" data) we don't load labels if the groupBy variable is not active
      // (see src/pages/ProfilesExplorerView/data/labels/LabelsDataSource.ts)
      // we have to wait until the new groupBy options have been loaded
      // if not, its value will default to "all" regardless of our call to "changeValueTo"
      // this happens, e.g., when landing on Favorites then jumping to "Service label" by clicking on a favorite that contains a "groupBy" label value
      const groupBySub = groupByVariable.subscribeToState((newState, prevState) => {
        if (!newState.loading && prevState.loading) {
          groupByVariable.changeValueTo(groupBy.label);
          groupBySub.unsubscribe();
        }
      });
    }

    if (panelType) {
      (findSceneObjectByClass(this, ScenePanelTypeSwitcher) as ScenePanelTypeSwitcher).setState({ panelType });
    }
  }

  getVariablesAndGridControls(explorationType: ExplorationType) {
    const [dataSourceVariable, serviceNameVariable, profileMetricVariable, filtersVariable] = this.state.$variables!
      .state.variables as [DataSourceVariable, ServiceNameVariable, ProfileMetricVariable, FiltersVariable];

    switch (explorationType) {
      case ExplorationType.ALL_SERVICES:
        return {
          variables: [dataSourceVariable, profileMetricVariable],
          gridControls: this.state.gridControls.filter((control) => !(control instanceof ScenePanelTypeSwitcher)),
        };

      case ExplorationType.PROFILE_TYPES:
        return {
          variables: [dataSourceVariable, serviceNameVariable],
          gridControls: this.state.gridControls.filter((control) => !(control instanceof ScenePanelTypeSwitcher)),
        };

      case ExplorationType.LABELS:
      case ExplorationType.FLAME_GRAPH:
        return {
          // note that SceneGroupByLabels will directly get groupByVariable and gridControls as the layout is a bit different
          variables: [dataSourceVariable, serviceNameVariable, profileMetricVariable, filtersVariable],
          gridControls: [],
        };

      case ExplorationType.FAVORITES:
      default:
        return {
          variables: [dataSourceVariable],
          gridControls: this.state.gridControls.filter((control) => !(control instanceof ScenePanelTypeSwitcher)),
        };
    }
  }

  onChangeExplorationType = (explorationType: string) => {
    reportInteraction('g_pyroscope_app_exploration_type_clicked', { explorationType });

    (findSceneObjectByClass(this, SceneQuickFilter) as SceneQuickFilter)?.clear();

    // findSceneObjectByClass() throws if not found
    (sceneGraph.findObject(this, (o) => o instanceof GroupByVariable) as GroupByVariable)?.changeValueTo(
      GroupByVariable.DEFAULT_VALUE
    );

    if (![ExplorationType.LABELS, ExplorationType.FLAME_GRAPH].includes(explorationType as ExplorationType)) {
      (findSceneObjectByClass(this, FiltersVariable) as FiltersVariable)?.setState({
        filters: FiltersVariable.DEFAULT_VALUE,
      });
    }

    (findSceneObjectByClass(this, ScenePanelTypeSwitcher) as ScenePanelTypeSwitcher)?.setState({
      panelType: ScenePanelTypeSwitcher.DEFAULT_PANEL_TYPE,
    });

    this.setExplorationType(explorationType as ExplorationType);
  };

  onClickShareLink = async () => {
    try {
      const shareableUrl = new URL(window.location.toString());

      ['from', 'to'].forEach((name) => {
        shareableUrl.searchParams.set(name, String(dateTimeParse(shareableUrl.searchParams.get(name)).valueOf()));
      });

      await navigator.clipboard.writeText(shareableUrl.toString());
      displaySuccess(['Link copied to clipboard!']);
    } catch {}
  };

  useExplorationTypeSelectorLayout = () => {
    const headerRef = useRef<HTMLDivElement>(null);
    const headerLeftRef = useRef<HTMLDivElement>(null);
    const headerRightRef = useRef<HTMLDivElement>(null);

    const [layout, setLayout] = useState<ExplorationTypeSelectorProps['layout']>('radio');

    const onResize = () => {
      const currentRight = headerRightRef.current?.getBoundingClientRect();
      setLayout(Math.ceil(currentRight?.left || 970) >= 970 ? 'radio' : 'select');
    };

    useResizeObserver({ ref: headerRef, onResize });
    useResizeObserver({ ref: headerRightRef, onResize });

    return {
      headerRef,
      headerLeftRef,
      headerRightRef,
      layout,
    };
  };

  useProfilesExplorer = () => {
    const { explorationType, controls, body } = this.useState();

    const [timePickerControl, refreshPickerControl] = controls as [SceneObject, SceneObject];

    const { variables, gridControls } = this.getVariablesAndGridControls(explorationType as ExplorationType);
    const [dataSourceVariable, ...sceneVariables] = variables as SceneVariable[];

    const {
      headerRef,
      headerLeftRef,
      headerRightRef,
      layout: explorationTypeSelectorLayout,
    } = this.useExplorationTypeSelectorLayout();

    return {
      data: {
        explorationType,
        dataSourceVariable,
        timePickerControl,
        refreshPickerControl,
        headerRefs: {
          full: headerRef,
          left: headerLeftRef,
          right: headerRightRef,
        },
        explorationTypeSelectorLayout,
        sceneVariables,
        gridControls,
        body,
      },
      actions: {
        onChangeExplorationType: this.onChangeExplorationType,
        onClickShareLink: this.onClickShareLink,
      },
    };
  };

  static Component({ model }: SceneComponentProps<SceneProfilesExplorer>) {
    const styles = useStyles2(getStyles); // eslint-disable-line react-hooks/rules-of-hooks
    const { data, actions } = model.useProfilesExplorer();

    const {
      explorationType,
      dataSourceVariable,
      timePickerControl,
      refreshPickerControl,
      headerRefs,
      explorationTypeSelectorLayout,
      sceneVariables,
      gridControls,
      body,
    } = data;

    return (
      <>
        <div ref={headerRefs.full} className={styles.header}>
          <div className={styles.controls}>
            <div ref={headerRefs.left} className={styles.headerLeft}>
              <div className={styles.dataSourceVariable}>
                <InlineLabel width="auto">{dataSourceVariable.state.label}</InlineLabel>
                <dataSourceVariable.Component model={dataSourceVariable} />
              </div>

              <ExplorationTypeSelector
                layout={explorationTypeSelectorLayout}
                options={SceneProfilesExplorer.EXPLORATION_TYPE_OPTIONS}
                value={explorationType as string}
                onChange={actions.onChangeExplorationType}
              />
            </div>

            <div ref={headerRefs.right} className={styles.headerRight}>
              <timePickerControl.Component key={timePickerControl.state.key} model={timePickerControl} />
              <refreshPickerControl.Component key={refreshPickerControl.state.key} model={refreshPickerControl} />
              <IconButton
                name="share-alt"
                tooltip="Copy shareable link to the clipboard"
                onClick={actions.onClickShareLink}
              />
              <VersionInfoTooltip />
            </div>
          </div>

          <div id={`scene-controls-${explorationType}`} className={styles.sceneControls}>
            {sceneVariables.map((variable) => (
              <div key={variable.state.name} className={styles.variable}>
                <InlineLabel width="auto">{variable.state.label}</InlineLabel>
                <variable.Component model={variable} />
              </div>
            ))}

            {gridControls.map((control) => (
              <control.Component key={control.key} model={control} />
            ))}
          </div>
        </div>

        <div className={styles.body}>{body && <body.Component model={body} />}</div>
      </>
    );
  }
}

const getStyles = (theme: GrafanaTheme2) => ({
  header: css`
    background-color: ${theme.colors.background.canvas};
    position: sticky;
    top: 0;
    z-index: 1;
  `,
  controls: css`
    display: flex;
    padding: ${theme.spacing(1)} 0;
    justify-content: space-between;
    gap: ${theme.spacing(4)};
  `,
  headerLeft: css`
    display: flex;
    gap: ${theme.spacing(1)};
  `,
  dataSourceVariable: css`
    display: flex;
    min-width: 160px;
  `,
  explorationTypeContainer: css`
    display: flex;
  `,
  explorationTypeRadio: css`
    display: flex;
  `,
  explorationTypeSelect: css`
    display: flex;
    min-width: 180px;
  `,
  headerRight: css`
    display: flex;
    gap: ${theme.spacing(1)};
  `,
  variable: css`
    display: flex;
  `,
  sceneControls: css`
    display: flex;
    flex-wrap: wrap;
    gap: ${theme.spacing(1)};
    padding: 0 0 ${theme.spacing(1)} 0;

    &#scene-controls-labels > div:last-child,
    &#scene-controls-flame-graph > div:last-child {
      flex-grow: 1;
    }
  `,
  body: css`
    position: relative;
    z-index: 0;
    margin-top: ${theme.spacing(1)};
    background: transparent;
  `,
});
