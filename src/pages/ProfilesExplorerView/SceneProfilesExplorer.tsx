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
import { IconButton, InlineLabel, RadioButtonGroup, Stack, useStyles2 } from '@grafana/ui';
import { displaySuccess } from '@shared/domain/displayStatus';
import React from 'react';

import { SceneLayoutSwitcher } from './components/SceneLayoutSwitcher';
import { SceneNoDataSwitcher } from './components/SceneNoDataSwitcher';
import { SceneQuickFilter } from './components/SceneQuickFilter';
import { FavoritesDataSource } from './data/FavoritesDataSource';
import { LabelsDataSource } from './data/LabelsDataSource';
import { ProfileMetricsDataSource } from './data/ProfileMetricsDataSource';
import {
  PYROSCOPE_LABELS_DATA_SOURCE,
  PYROSCOPE_PROFILE_FAVORIES_DATA_SOURCE,
  PYROSCOPE_PROFILE_METRICS_DATA_SOURCE,
  PYROSCOPE_SERVICES_DATA_SOURCE,
} from './data/pyroscope-data-sources';
import { ServicesDataSource } from './data/ServicesDataSource';
import { EventExplore } from './events/EventExplore';
import { EventViewDetails } from './events/EventViewDetails';
import { findSceneObjectByClass } from './helpers/findSceneObjectByClass';
import { SceneExploreAllServices } from './SceneExploreAllServices/SceneExploreAllServices';
import { SceneExploreFavorites } from './SceneExploreFavorites/SceneExploreFavorites';
import { SceneExploreSingleService } from './SceneExploreSingleService/SceneExploreSingleService';
import { SceneServiceDetails } from './SceneServiceDetails/SceneServiceDetails';
import { GridItemData } from './types/GridItemData';
import { FilterByVariable } from './variables/FilterByVariable/FilterByVariable';
import { GroupByVariable } from './variables/GroupByVariable/GroupByVariable';
import { ProfileMetricVariable } from './variables/ProfileMetricVariable';
import { ProfilesDataSourceVariable } from './variables/ProfilesDataSourceVariable';
import { ServiceNameVariable } from './variables/ServiceNameVariable';

export interface SceneProfilesExplorerState extends Partial<EmbeddedSceneState> {
  explorationType?: ExplorationType;
  body?: SplitLayout;
  gridControls: any[]; // TODO
}

enum ExplorationType {
  ALL_SERVICES = 'all',
  SINGLE_SERVICE = 'single',
  SINGLE_SERVICE_DETAILS = 'details',
  FAVORITES = 'favorites',
}

export class SceneProfilesExplorer extends SceneObjectBase<SceneProfilesExplorerState> {
  static EXPLORATION_TYPE_OPTIONS = [
    {
      value: ExplorationType.ALL_SERVICES,
      label: 'All',
    },
    {
      value: ExplorationType.SINGLE_SERVICE,
      label: 'Single',
    },
    {
      value: ExplorationType.SINGLE_SERVICE_DETAILS,
      label: 'Details',
    },
    {
      value: ExplorationType.FAVORITES,
      label: 'Favorites',
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
      $variables: new SceneVariableSet({ variables: [] }), // see buildScene()
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
    const exploreSub = this.subscribeToEvent(EventExplore, (event) => {
      this.setExplorationType(ExplorationType.SINGLE_SERVICE, event.payload.item);

      (findSceneObjectByClass(this, SceneQuickFilter) as SceneQuickFilter)?.clear();
    });

    const selectSub = this.subscribeToEvent(EventViewDetails, (event) => {
      this.setExplorationType(ExplorationType.SINGLE_SERVICE_DETAILS, event.payload.item);

      (findSceneObjectByClass(this, SceneQuickFilter) as SceneQuickFilter)?.clear();
    });

    return {
      unsubscribe() {
        selectSub.unsubscribe();
        exploreSub.unsubscribe();
      },
    };
  }

  setExplorationType(explorationType: ExplorationType, gridItemData?: GridItemData) {
    const { body, variables } = this.buildScene(explorationType, gridItemData);

    this.setState({
      explorationType,
      body,
      $variables: new SceneVariableSet({
        variables: [new ProfilesDataSourceVariable({}), ...variables],
      }),
    });
  }

  updateQuickFilterPlaceholder(newPlaceholder: string) {
    (this.state.gridControls[0] as SceneQuickFilter).setPlaceholder(newPlaceholder);
  }

  buildScene(explorationType: ExplorationType, gridItemData?: GridItemData) {
    let primary;
    let variables: SceneVariable[];

    switch (explorationType) {
      case ExplorationType.SINGLE_SERVICE:
        primary = new SceneExploreSingleService();
        variables = [new ServiceNameVariable({ value: gridItemData?.queryRunnerParams.serviceName })];

        this.updateQuickFilterPlaceholder('Search profile metrics (comma-separated regexes are supported)');
        break;

      case ExplorationType.SINGLE_SERVICE_DETAILS:
        primary = new SceneServiceDetails();
        variables = [
          new ServiceNameVariable({ value: gridItemData?.queryRunnerParams.serviceName }),
          new ProfileMetricVariable({ value: gridItemData?.queryRunnerParams.profileMetricId }),
          new GroupByVariable({ value: gridItemData?.queryRunnerParams.groupBy?.label }),
          new FilterByVariable({ initialFilters: gridItemData?.queryRunnerParams.filters }),
        ];
        break;

      case ExplorationType.FAVORITES:
        primary = new SceneExploreFavorites();
        variables = [];

        this.updateQuickFilterPlaceholder('Search favorites (comma-separated regexes are supported)');
        break;

      case ExplorationType.ALL_SERVICES:
      default:
        primary = new SceneExploreAllServices();
        variables = [new ProfileMetricVariable({ value: gridItemData?.queryRunnerParams.profileMetricId })];

        this.updateQuickFilterPlaceholder('Search services  (comma-separated regexes are supported)');
    }

    return {
      body: new SplitLayout({
        direction: 'column',
        primary,
      }),
      variables,
    };
  }

  onChangeExplorationType = (explorationType: ExplorationType) => {
    this.setExplorationType(explorationType);

    (findSceneObjectByClass(this, SceneQuickFilter) as SceneQuickFilter)?.clear();

    // findSceneObjectByClass() throws if not found
    (sceneGraph.findObject(this, (o) => o instanceof GroupByVariable) as GroupByVariable)?.changeValueTo(
      GroupByVariable.DEFAULT_VALUE,
      GroupByVariable.DEFAULT_VALUE
    );
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
    const { explorationType, controls, gridControls, body, $variables } = model.useState();

    const [timePickerControl, refreshPickerControl] = controls as [SceneObject, SceneObject];
    const [dataSourceVariable, ...otherVariables] = $variables!.state.variables;
    const sceneVariables = otherVariables.filter((v) => !(v instanceof GroupByVariable));

    return (
      <>
        <div className={styles.header}>
          <div className={styles.controls}>
            <Stack justifyContent="space-between" wrap="wrap">
              <Stack>
                <div className={styles.variable}>
                  <InlineLabel width="auto">{dataSourceVariable.state.label}</InlineLabel>
                  <dataSourceVariable.Component model={dataSourceVariable} />
                </div>

                <div className={styles.explorationType}>
                  <InlineLabel
                    className={styles.label}
                    width="auto"
                    tooltip={
                      <div className={styles.tooltipContent}>
                        <h5>Types of exploration</h5>
                        <dl>
                          <dt>All</dt>
                          <dd>Overview of all your services, for any given profile metric</dd>
                          <dt>Single</dt>
                          <dd>Overview of all the profile metrics for a single service</dd>
                          <dt>Details</dt>
                          <dd>
                            Detailled view of a specific service, including its flame graph and the ability to explore
                            labels
                          </dd>
                          <dt>Favorites</dt>
                          <dd>Overview of your favorite visualizations</dd>
                        </dl>
                      </div>
                    }
                  >
                    Exploration type
                  </InlineLabel>
                  <RadioButtonGroup
                    options={SceneProfilesExplorer.EXPLORATION_TYPE_OPTIONS}
                    value={explorationType}
                    fullWidth={false}
                    onChange={model.onChangeExplorationType}
                  />
                </div>
              </Stack>

              <Stack>
                <timePickerControl.Component key={timePickerControl.state.key} model={timePickerControl} />
                <refreshPickerControl.Component key={refreshPickerControl.state.key} model={refreshPickerControl} />
                <IconButton
                  name="share-alt"
                  tooltip="Copy shareable link to the clipboard"
                  onClick={model.onClickShareLink}
                />
              </Stack>
            </Stack>
          </div>

          <div id={`scene-controls-${explorationType}`} className={styles.sceneControls}>
            {sceneVariables.map((variable) => (
              <div key={variable.state.name} className={styles.variable}>
                <InlineLabel className={styles.label} width="auto">
                  {variable.state.label}
                </InlineLabel>
                <variable.Component model={variable} />
              </div>
            ))}

            {/* Render scene controls in All, Single and Favorites exploration types */}
            {explorationType !== ExplorationType.SINGLE_SERVICE_DETAILS &&
              gridControls.map((control) => <control.Component key={control.key} model={control} />)}
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
  label: css``,
  variable: css`
    display: flex;
  `,
  explorationType: css`
    display: flex;
  `,
  sceneControls: css`
    display: flex;
    flex-wrap: wrap;
    gap: ${theme.spacing(1)};
    padding: 0 0 ${theme.spacing(1)} 0;

    &#scene-controls-details > div:last-child {
      flex-grow: 1;
    }
  `,
  tooltipContent: css`
    padding: ${theme.spacing(1)};

    & dl {
      display: grid;
      grid-gap: 4px 16px;
      grid-template-columns: max-content;
    }
    & dt {
      font-weight: bold;
    }
    & dd {
      margin: 0;
      grid-column-start: 2;
    }
  `,
  body: css`
    position: relative;
    z-index: 0;
    margin-top: ${theme.spacing(1)};
    background: transparent;
  `,
});
