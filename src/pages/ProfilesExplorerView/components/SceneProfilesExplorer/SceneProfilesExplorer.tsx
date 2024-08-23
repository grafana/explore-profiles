import { css } from '@emotion/css';
import { dateTimeParse, GrafanaTheme2 } from '@grafana/data';
import {
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
import { displayError, displaySuccess } from '@shared/domain/displayStatus';
import { prepareHistoryEntry } from '@shared/domain/history';
import { reportInteraction } from '@shared/domain/reportInteraction';
import { VersionInfoTooltip } from '@shared/ui/VersionInfoTooltip';
import React from 'react';

import { SceneExploreAllServices } from '../../components/SceneExploreAllServices/SceneExploreAllServices';
import { SceneExploreFavorites } from '../../components/SceneExploreFavorites/SceneExploreFavorites';
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
import { FavoritesDataSource } from '../../infrastructure/favorites/FavoritesDataSource';
import { LabelsDataSource } from '../../infrastructure/labels/LabelsDataSource';
import { SeriesDataSource } from '../../infrastructure/series/SeriesDataSource';
import { SceneLayoutSwitcher } from '../SceneByVariableRepeaterGrid/components/SceneLayoutSwitcher';
import { SceneNoDataSwitcher } from '../SceneByVariableRepeaterGrid/components/SceneNoDataSwitcher';
import { ScenePanelTypeSwitcher } from '../SceneByVariableRepeaterGrid/components/ScenePanelTypeSwitcher';
import { SceneQuickFilter } from '../SceneByVariableRepeaterGrid/components/SceneQuickFilter';
import { GridItemData } from '../SceneByVariableRepeaterGrid/types/GridItemData';
import { SceneExploreServiceFlameGraph } from '../SceneExploreServiceFlameGraph/SceneExploreServiceFlameGraph';
import { ExplorationTypeSelector } from './ui/ExplorationTypeSelector';

export interface SceneProfilesExplorerState extends Partial<EmbeddedSceneState> {
  $variables: SceneVariableSet;
  gridControls: Array<SceneObject & { key?: string }>;
  explorationType?: ExplorationType;
  body?: SplitLayout;
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
      icon: 'favorite',
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

    this.setExplorationType({
      type: Object.values(ExplorationType).includes(this.state.explorationType as ExplorationType)
        ? (this.state.explorationType as ExplorationType)
        : SceneProfilesExplorer.DEFAULT_EXPLORATION_TYPE,
    });

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
    if (typeof values.explorationType === 'string' && values.explorationType !== this.state.explorationType) {
      const type = values.explorationType as ExplorationType;
      this.setExplorationType({ type });
    }
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
      this.setExplorationType({
        type: ExplorationType.PROFILE_TYPES,
        comesFromUserAction: true,
        item: event.payload.item,
      });
    });

    const labelsSub = this.subscribeToEvent(EventViewServiceLabels, (event) => {
      this.setExplorationType({
        type: ExplorationType.LABELS,
        comesFromUserAction: true,
        item: event.payload.item,
      });
    });

    const flameGraphSub = this.subscribeToEvent(EventViewServiceFlameGraph, (event) => {
      this.setExplorationType({
        type: ExplorationType.FLAME_GRAPH,
        comesFromUserAction: true,
        item: event.payload.item,
      });
    });

    return {
      unsubscribe() {
        flameGraphSub.unsubscribe();
        labelsSub.unsubscribe();
        profilesSub.unsubscribe();
      },
    };
  }

  setExplorationType({
    type,
    comesFromUserAction,
    item,
  }: {
    type: ExplorationType;
    comesFromUserAction?: boolean;
    item?: GridItemData;
  }) {
    if (comesFromUserAction) {
      prepareHistoryEntry();
      this.resetVariables(type);
    }

    this.setState({
      explorationType: type,
      body: this.buildBodyScene(type, item),
    });
  }

  buildBodyScene(explorationType: ExplorationType, item?: GridItemData) {
    let primary;

    switch (explorationType) {
      case ExplorationType.PROFILE_TYPES:
        primary = new SceneExploreServiceProfileTypes({ item });
        break;

      case ExplorationType.LABELS:
        primary = new SceneExploreServiceLabels({ item });
        break;

      case ExplorationType.FLAME_GRAPH:
        primary = new SceneExploreServiceFlameGraph({ item });
        break;

      case ExplorationType.FAVORITES:
        primary = new SceneExploreFavorites();
        break;

      case ExplorationType.ALL_SERVICES:
      default:
        primary = new SceneExploreAllServices();
    }

    return new SplitLayout({
      direction: 'column',
      primary,
    });
  }

  onChangeExplorationType = (explorationType: string) => {
    reportInteraction('g_pyroscope_app_exploration_type_clicked', { explorationType });

    this.setExplorationType({
      type: explorationType as ExplorationType,
      comesFromUserAction: true,
    });
  };

  resetVariables(explorationType: string) {
    sceneGraph.findByKeyAndType(this, 'quick-filter', SceneQuickFilter).clear();

    if (![ExplorationType.LABELS, ExplorationType.FLAME_GRAPH].includes(explorationType as ExplorationType)) {
      sceneGraph.findByKeyAndType(this, 'filters', FiltersVariable)?.setState({
        filters: FiltersVariable.DEFAULT_VALUE,
      });
    }

    sceneGraph.findByKeyAndType(this, 'groupBy', GroupByVariable)?.changeValueTo(GroupByVariable.DEFAULT_VALUE);

    sceneGraph.findByKeyAndType(this, 'panel-type-switcher', ScenePanelTypeSwitcher)?.reset();
  }

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

  useProfilesExplorer = () => {
    const { explorationType, controls, body, $variables } = this.useState();

    const [timePickerControl, refreshPickerControl] = controls as [SceneObject, SceneObject];
    const dataSourceVariable = $variables.state.variables[0] as ProfilesDataSourceVariable;

    const { variables: sceneVariables, gridControls } = (body?.state.primary as any).getVariablesAndGridControls() as {
      variables: SceneVariable[];
      gridControls: SceneObject[];
    };

    return {
      data: {
        explorationType,
        dataSourceVariable,
        timePickerControl,
        refreshPickerControl,
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
      sceneVariables,
      gridControls,
      body,
    } = data;

    return (
      <>
        <div className={styles.header}>
          <div className={styles.controls}>
            <div className={styles.headerLeft}>
              <div className={styles.dataSourceVariable}>
                <InlineLabel width="auto">{dataSourceVariable.state.label}</InlineLabel>
                <dataSourceVariable.Component model={dataSourceVariable} />
              </div>

              <ExplorationTypeSelector
                options={SceneProfilesExplorer.EXPLORATION_TYPE_OPTIONS}
                value={explorationType as string}
                onChange={actions.onChangeExplorationType}
              />
            </div>

            <div className={styles.headerRight}>
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
              <control.Component key={control.state.key} model={control} />
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
  headerRight: css`
    display: flex;
    gap: ${theme.spacing(1)};
  `,
  dataSourceVariable: css`
    display: flex;
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
