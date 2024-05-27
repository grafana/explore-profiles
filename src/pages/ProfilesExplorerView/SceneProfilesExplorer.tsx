import { css } from '@emotion/css';
import { dateTimeParse, GrafanaTheme2 } from '@grafana/data';
import {
  EmbeddedSceneState,
  getUrlSyncManager,
  SceneComponentProps,
  SceneObjectBase,
  SceneObjectUrlSyncConfig,
  SceneObjectUrlValues,
  SceneRefreshPicker,
  SceneTimePicker,
  SceneTimeRange,
  sceneUtils,
  SceneVariableSet,
  SplitLayout,
} from '@grafana/scenes';
import { IconButton, InlineLabel, RadioButtonGroup, Stack, useStyles2 } from '@grafana/ui';
import { displaySuccess } from '@shared/domain/displayStatus';
import React from 'react';

import { SceneLayoutSwitcher } from './components/SceneLayoutSwitcher';
import { SceneNoDataSwitcher } from './components/SceneNoDataSwitcher';
import { SceneQuickFilter } from './components/SceneQuickFilter';
import { ProfileMetricsDataSource } from './data/ProfileMetricsDataSource';
import { PYROSCOPE_PROFILE_METRICS_DATA_SOURCE, PYROSCOPE_SERVICES_DATA_SOURCE } from './data/pyroscope-data-source';
import { ServicesDataSource } from './data/ServicesDataSource';
import { EventExplore } from './events/EventExplore';
import { EventViewDetails } from './events/EventViewDetails';
import { SceneExploreAllServices } from './SceneExploreAllServices/SceneExploreAllServices';
import { SceneExploreFavorites } from './SceneExploreFavorites/SceneExploreFavorites';
import { SceneExploreSingleService } from './SceneExploreSingleService/SceneExploreSingleService';
import { SceneServiceDetails } from './SceneServiceDetails/SceneServiceDetails';
import { ProfileMetricVariable } from './variables/ProfileMetricVariable';
import { ProfilesDataSourceVariable } from './variables/ProfilesDataSourceVariable';
import { ServiceNameVariable } from './variables/ServiceNameVariable';

export interface SceneProfilesExplorerState extends Partial<EmbeddedSceneState> {
  explorationType?: ExplorationType;
  body?: SplitLayout;
  subControls: any[]; // TODO
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
      $variables: new SceneVariableSet({ variables: [] }),
      controls: [new SceneTimePicker({ isOnCanvas: true }), new SceneRefreshPicker({ isOnCanvas: true })],
      // these scenes sync with the URL so...
      // ...because of a limitation of the Scenes library, we have to create them now, once, and not every time we set a new exploration type
      subControls: [
        new SceneQuickFilter({ placeholder: '' }),
        new SceneLayoutSwitcher(),
        new SceneNoDataSwitcher(),
        // new QueryBuilderVariable({}),
      ],
    });

    getUrlSyncManager().initSync(this);

    this.registerRuntimeDataSources();

    this.addActivationHandler(() => {
      const eventsSub = this.subscribeToEvents();

      const explorationType = Object.values(ExplorationType).includes(this.state.explorationType as ExplorationType)
        ? (this.state.explorationType as ExplorationType)
        : SceneProfilesExplorer.DEFAULT_EXPLORATION_TYPE;

      this.setExplorationType(explorationType);

      return () => {
        eventsSub.unsubscribe();
      };
    });
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
    sceneUtils.registerRuntimeDataSource({
      dataSource: new ServicesDataSource(PYROSCOPE_SERVICES_DATA_SOURCE.type, PYROSCOPE_SERVICES_DATA_SOURCE.uid),
    });

    sceneUtils.registerRuntimeDataSource({
      dataSource: new ProfileMetricsDataSource(
        PYROSCOPE_PROFILE_METRICS_DATA_SOURCE.type,
        PYROSCOPE_PROFILE_METRICS_DATA_SOURCE.uid
      ),
    });
  }

  subscribeToEvents() {
    const exploreSub = this.subscribeToEvent(EventExplore, (event) => {
      this.setExplorationType(ExplorationType.SINGLE_SERVICE, { serviceName: event.payload.params.serviceName });
    });

    const selectSub = this.subscribeToEvent(EventViewDetails, (event) => {
      const { serviceName, profileMetricId, color } = event.payload.params;

      this.setExplorationType(ExplorationType.SINGLE_SERVICE_DETAILS, {
        serviceName,
        profileMetricId,
        color,
      });
    });

    return {
      unsubscribe() {
        selectSub.unsubscribe();
        exploreSub.unsubscribe();
      },
    };
  }

  setExplorationType(explorationType: ExplorationType, initialBodyState?: Record<string, any>) {
    const { body, variables } = this.buildScene(explorationType, initialBodyState);

    this.setState({
      explorationType,
      body,
      $variables: new SceneVariableSet({
        variables: [new ProfilesDataSourceVariable({}), ...variables],
      }),
    });
  }

  buildScene(explorationType: ExplorationType, initialBodyState: Record<string, any> = {}) {
    let primary;
    let variables: any[]; // TODO

    switch (explorationType) {
      case ExplorationType.SINGLE_SERVICE:
        primary = new SceneExploreSingleService();
        variables = [new ServiceNameVariable({ value: initialBodyState.serviceName })];
        this.state.subControls[0].setState({ placeholder: 'Search profile metrics by name' });
        break;

      case ExplorationType.SINGLE_SERVICE_DETAILS:
        primary = new SceneServiceDetails();
        variables = [
          new ServiceNameVariable({ value: initialBodyState.serviceName }),
          new ProfileMetricVariable({ value: initialBodyState.profileMetricId }),
          // new QueryBuilderVariable({}),
        ];
        break;

      case ExplorationType.FAVORITES:
        primary = new SceneExploreFavorites();
        variables = [];
        this.state.subControls[0].setState({ placeholder: 'Search favorites' });
        break;

      case ExplorationType.ALL_SERVICES:
      default:
        primary = new SceneExploreAllServices();
        variables = [new ProfileMetricVariable({ value: initialBodyState.profileMetricId })];
        this.state.subControls[0].setState({ placeholder: 'Search services by name' });
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
    const { explorationType, controls, subControls, body, $variables } = model.useState();

    const [timePickerControl, refreshPickerControl] = controls || [];
    const [dataSourceVariable, ...otherVariables] = $variables?.state.variables || [];

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
                          <dd>Detailled view a specific service, with its flame graph</dd>
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
                  tooltip="Copy shareable link to clipboard"
                  onClick={model.onClickShareLink}
                />
              </Stack>
            </Stack>
          </div>

          <div className={styles.sceneControls}>
            {subControls.length ? (
              <Stack wrap="wrap">
                {otherVariables.map((otherVariable) => (
                  <div key={otherVariable.state.name} className={styles.variable}>
                    <InlineLabel className={styles.label} width="auto">
                      {otherVariable.state.label}
                    </InlineLabel>
                    <otherVariable.Component model={otherVariable} />
                  </div>
                ))}

                {explorationType !== ExplorationType.SINGLE_SERVICE_DETAILS &&
                  subControls.map((subControl) => <subControl.Component key={subControl.key} model={subControl} />)}
              </Stack>
            ) : null}
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
    padding: ${theme.spacing(1)} 0;
  `,
  subControls: css`
    display: flex;
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
