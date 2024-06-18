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
import { IconButton, InlineLabel, Stack, useStyles2 } from '@grafana/ui';
import { displaySuccess } from '@shared/domain/displayStatus';
import { VersionInfoTooltip } from '@shared/ui/VersionInfoTooltip';
import React from 'react';

import { SceneLayoutSwitcher } from '../components/SceneLayoutSwitcher';
import { SceneNoDataSwitcher } from '../components/SceneNoDataSwitcher';
import { SceneQuickFilter } from '../components/SceneQuickFilter';
import { FavoritesDataSource } from '../data/FavoritesDataSource';
import { LabelsDataSource } from '../data/LabelsDataSource';
import { ProfileMetricsDataSource } from '../data/ProfileMetricsDataSource';
import {
  PYROSCOPE_LABELS_DATA_SOURCE,
  PYROSCOPE_PROFILE_FAVORIES_DATA_SOURCE,
  PYROSCOPE_PROFILE_METRICS_DATA_SOURCE,
  PYROSCOPE_SERVICES_DATA_SOURCE,
} from '../data/pyroscope-data-sources';
import { ServicesDataSource } from '../data/ServicesDataSource';
import { EventViewServiceFlameGraph } from '../events/EventViewServiceFlameGraph';
import { EventViewServiceLabels } from '../events/EventViewServiceLabels';
import { EventViewServiceProfiles } from '../events/EventViewServiceProfiles';
import { findSceneObjectByClass } from '../helpers/findSceneObjectByClass';
import { SceneExploreAllServices } from '../SceneExploreAllServices/SceneExploreAllServices';
import { SceneExploreFavorites } from '../SceneExploreFavorites/SceneExploreFavorites';
import { SceneExploreServiceLabels } from '../SceneExploreServiceLabels/SceneExploreServiceLabels';
import { SceneExploreSingleService } from '../SceneExploreSingleService/SceneExploreSingleService';
import { SceneServiceFlameGraph } from '../SceneServiceFlameGraph/SceneServiceFlameGraph';
import { GridItemData } from '../types/GridItemData';
import { FiltersVariable } from '../variables/FiltersVariable/FiltersVariable';
import { GroupByVariable } from '../variables/GroupByVariable/GroupByVariable';
import { ProfileMetricVariable } from '../variables/ProfileMetricVariable';
import { ProfilesDataSourceVariable } from '../variables/ProfilesDataSourceVariable';
import { ServiceNameVariable } from '../variables/ServiceNameVariable';
import { ExplorationTypeSelector } from './ExplorationTypeSelector';

export interface SceneProfilesExplorerState extends Partial<EmbeddedSceneState> {
  explorationType?: ExplorationType;
  body?: SplitLayout;
  gridControls: any[]; // TODO
}

export enum ExplorationType {
  ALL_SERVICES = 'all',
  SINGLE_SERVICE = 'single',
  SINGLE_SERVICE_LABELS = 'labels',
  SINGLE_SERVICE_FLAME_GRAPH = 'flame-graph',
  FAVORITES = 'favorites',
}

export class SceneProfilesExplorer extends SceneObjectBase<SceneProfilesExplorerState> {
  static EXPLORATION_TYPE_OPTIONS = [
    {
      value: ExplorationType.ALL_SERVICES,
      label: 'All services',
      description: '', // no tooltip (see src/pages/ProfilesExplorerView/SceneProfilesExplorer/ExplorationTypeSelector.tsx)
    },
    {
      value: ExplorationType.SINGLE_SERVICE,
      label: 'Single service',
      description: '',
    },
    {
      value: ExplorationType.SINGLE_SERVICE_LABELS,
      label: 'Service labels',
      description: '',
    },
    {
      value: ExplorationType.SINGLE_SERVICE_FLAME_GRAPH,
      label: 'Flame graph',
      description: '',
    },
    {
      value: ExplorationType.FAVORITES,
      label: 'Favorites',
      description: '',
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
        // it's ok from a perf pov because fetching values will not occur if their components are not rendered
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
      gridControls: [new SceneQuickFilter({ placeholder: '' }), new SceneLayoutSwitcher(), new SceneNoDataSwitcher()],
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
      sceneUtils.registerRuntimeDataSource({
        dataSource: new ServicesDataSource(PYROSCOPE_SERVICES_DATA_SOURCE.type, PYROSCOPE_SERVICES_DATA_SOURCE.uid),
      });

      sceneUtils.registerRuntimeDataSource({
        dataSource: new ProfileMetricsDataSource(
          PYROSCOPE_PROFILE_METRICS_DATA_SOURCE.type,
          PYROSCOPE_PROFILE_METRICS_DATA_SOURCE.uid
        ),
      });

      sceneUtils.registerRuntimeDataSource({
        dataSource: new FavoritesDataSource(
          PYROSCOPE_PROFILE_FAVORIES_DATA_SOURCE.type,
          PYROSCOPE_PROFILE_FAVORIES_DATA_SOURCE.uid
        ),
      });

      sceneUtils.registerRuntimeDataSource({
        dataSource: new LabelsDataSource(PYROSCOPE_LABELS_DATA_SOURCE.type, PYROSCOPE_LABELS_DATA_SOURCE.uid),
      });
    } catch {}
  }

  subscribeToEvents() {
    const profilesSub = this.subscribeToEvent(EventViewServiceProfiles, (event) => {
      (findSceneObjectByClass(this, SceneQuickFilter) as SceneQuickFilter)?.clear();

      this.setExplorationType(ExplorationType.SINGLE_SERVICE, event.payload.item);
    });

    const labelsSub = this.subscribeToEvent(EventViewServiceLabels, (event) => {
      (findSceneObjectByClass(this, SceneQuickFilter) as SceneQuickFilter)?.clear();

      this.setExplorationType(ExplorationType.SINGLE_SERVICE_LABELS, event.payload.item);
    });

    const flameGraphSub = this.subscribeToEvent(EventViewServiceFlameGraph, (event) => {
      (findSceneObjectByClass(this, SceneQuickFilter) as SceneQuickFilter)?.clear();

      this.setExplorationType(ExplorationType.SINGLE_SERVICE_FLAME_GRAPH, event.payload.item);
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
      this.updateVariables(gridItemData.queryRunnerParams);
    }
  }

  buildBodyScene(explorationType: ExplorationType) {
    let primary;

    switch (explorationType) {
      case ExplorationType.SINGLE_SERVICE:
        primary = new SceneExploreSingleService();

        this.updateQuickFilterPlaceholder('Search profile metrics (comma-separated regexes are supported)');
        break;

      case ExplorationType.SINGLE_SERVICE_LABELS:
        primary = new SceneExploreServiceLabels();
        break;

      case ExplorationType.SINGLE_SERVICE_FLAME_GRAPH:
        primary = new SceneServiceFlameGraph();
        break;

      case ExplorationType.FAVORITES:
        primary = new SceneExploreFavorites();

        this.updateQuickFilterPlaceholder('Search favorites (comma-separated regexes are supported)');
        break;

      case ExplorationType.ALL_SERVICES:
      default:
        primary = new SceneExploreAllServices();

        this.updateQuickFilterPlaceholder('Search services  (comma-separated regexes are supported)');
    }

    return new SplitLayout({
      direction: 'column',
      primary,
    });
  }

  updateQuickFilterPlaceholder(newPlaceholder: string) {
    (this.state.gridControls[0] as SceneQuickFilter).setPlaceholder(newPlaceholder);
  }

  updateVariables(queryRunnerParams: GridItemData['queryRunnerParams']) {
    const [, serviceNameVariable, profileMetricVariable, filtersVariable, groupByVariable] = this.state.$variables!
      .state.variables as [
      DataSourceVariable,
      ServiceNameVariable,
      ProfileMetricVariable,
      FiltersVariable,
      GroupByVariable
    ];

    const { serviceName, profileMetricId, filters, groupBy } = queryRunnerParams;

    if (serviceName) {
      serviceNameVariable.changeValueTo(serviceName, serviceName);
    }

    if (profileMetricId) {
      profileMetricVariable.changeValueTo(profileMetricId);
    }

    if (filters) {
      filtersVariable.setState({ filters });
    }

    if (groupBy?.label) {
      groupByVariable.changeValueTo(groupBy.label, groupBy.label);
    }
  }

  getVariablesAndGridControls(explorationType: ExplorationType) {
    const [dataSourceVariable, serviceNameVariable, profileMetricVariable, filtersVariable] = this.state.$variables!
      .state.variables as [DataSourceVariable, ServiceNameVariable, ProfileMetricVariable, FiltersVariable];

    switch (explorationType) {
      case ExplorationType.ALL_SERVICES:
        return {
          variables: [dataSourceVariable, profileMetricVariable],
          gridControls: this.state.gridControls,
        };

      case ExplorationType.SINGLE_SERVICE:
        return {
          variables: [dataSourceVariable, serviceNameVariable],
          gridControls: this.state.gridControls,
        };

      case ExplorationType.SINGLE_SERVICE_LABELS:
      case ExplorationType.SINGLE_SERVICE_FLAME_GRAPH:
        return {
          // note that SceneGroupByLabels will directly get groupByVariable and gridControls as the layout is a bit different
          variables: [dataSourceVariable, serviceNameVariable, profileMetricVariable, filtersVariable],
          gridControls: [],
        };

      case ExplorationType.FAVORITES:
      default:
        return {
          variables: [dataSourceVariable],
          gridControls: this.state.gridControls,
        };
    }
  }

  onChangeExplorationType = (explorationType: ExplorationType) => {
    (findSceneObjectByClass(this, SceneQuickFilter) as SceneQuickFilter)?.clear();

    // findSceneObjectByClass() throws if not found
    (sceneGraph.findObject(this, (o) => o instanceof GroupByVariable) as GroupByVariable)?.changeValueTo(
      GroupByVariable.DEFAULT_VALUE,
      GroupByVariable.DEFAULT_VALUE
    );

    if (
      ![ExplorationType.SINGLE_SERVICE_LABELS, ExplorationType.SINGLE_SERVICE_FLAME_GRAPH].includes(explorationType)
    ) {
      (findSceneObjectByClass(this, FiltersVariable) as FiltersVariable)?.setState({
        filters: FiltersVariable.DEFAULT_VALUE,
      });
    }

    this.setExplorationType(explorationType);
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

  static Component({ model }: SceneComponentProps<SceneProfilesExplorer>) {
    const styles = useStyles2(getStyles); // eslint-disable-line react-hooks/rules-of-hooks
    const { explorationType, controls, body } = model.useState();

    const [timePickerControl, refreshPickerControl] = controls as [SceneObject, SceneObject];

    const { variables, gridControls } = model.getVariablesAndGridControls(explorationType as ExplorationType);
    const [dataSourceVariable, ...sceneVariables] = variables as SceneVariable[];

    return (
      <>
        <div className={styles.header}>
          <div className={styles.controls}>
            <Stack justifyContent="space-between" wrap="wrap">
              <Stack>
                <div className={styles.dataSourceVariable}>
                  <InlineLabel width="auto">{dataSourceVariable.state.label}</InlineLabel>
                  <dataSourceVariable.Component model={dataSourceVariable} />
                </div>

                <ExplorationTypeSelector
                  options={SceneProfilesExplorer.EXPLORATION_TYPE_OPTIONS}
                  value={explorationType as ExplorationType}
                  onChange={model.onChangeExplorationType}
                />
              </Stack>

              <Stack>
                <timePickerControl.Component key={timePickerControl.state.key} model={timePickerControl} />
                <refreshPickerControl.Component key={refreshPickerControl.state.key} model={refreshPickerControl} />
                <IconButton
                  name="share-alt"
                  tooltip="Copy shareable link to the clipboard"
                  onClick={model.onClickShareLink}
                />
                <VersionInfoTooltip />
              </Stack>
            </Stack>
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
    padding: ${theme.spacing(1)} 0;
  `,
  dataSourceVariable: css`
    display: flex;

    & > div {
      max-width: 180px;
    }
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
