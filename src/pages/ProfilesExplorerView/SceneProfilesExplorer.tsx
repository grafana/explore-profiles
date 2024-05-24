import { css } from '@emotion/css';
import { GrafanaTheme2 } from '@grafana/data';
import {
  EmbeddedSceneState,
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
  VariableValueSelectors,
} from '@grafana/scenes';
import { InlineLabel, RadioButtonGroup, Stack, useStyles2 } from '@grafana/ui';
import React from 'react';

import { ProfileMetricsDataSource } from './data/ProfileMetricsDataSource';
import { PYROSCOPE_PROFILE_METRICS_DATA_SOURCE, PYROSCOPE_SERVICES_DATA_SOURCE } from './data/pyroscope-data-source';
import { ServicesDataSource } from './data/ServicesDataSource';
import { EventExplore } from './events/EventExplore';
import { EventSelect } from './events/EventSelect';
import { SceneExploreAllServices } from './SceneExploreAllServices/SceneExploreAllServices';
import { SceneExploreFavorites } from './SceneExploreFavorites/SceneExploreFavorites';
import { SceneExploreSingleService } from './SceneExploreSingleService/SceneExploreSingleService';
import { SceneServiceDetails } from './SceneServiceDetails/SceneServiceDetails';
import { ProfilesDataSourceVariable } from './variables/ProfilesDataSourceVariable';

export interface SceneProfilesExplorerState extends Partial<EmbeddedSceneState> {
  explorationType?: ExplorationType;
  body?: SplitLayout;
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
    sceneUtils.registerRuntimeDataSource({
      dataSource: new ServicesDataSource(PYROSCOPE_SERVICES_DATA_SOURCE.type, PYROSCOPE_SERVICES_DATA_SOURCE.uid),
    });

    sceneUtils.registerRuntimeDataSource({
      dataSource: new ProfileMetricsDataSource(
        PYROSCOPE_PROFILE_METRICS_DATA_SOURCE.type,
        PYROSCOPE_PROFILE_METRICS_DATA_SOURCE.uid
      ),
    });

    super({
      key: 'profiles-explorer',
      explorationType: undefined,
      body: undefined,
      $timeRange: new SceneTimeRange({}),
      $variables: new SceneVariableSet({
        variables: [new ProfilesDataSourceVariable({})],
      }),
      controls: [
        new VariableValueSelectors({}),
        new SceneTimePicker({ isOnCanvas: true }),
        new SceneRefreshPicker({ isOnCanvas: true }),
      ],
    });

    this.onChangeExplorationType = this.onChangeExplorationType.bind(this);

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

  subscribeToEvents() {
    const exploreSub = this.subscribeToEvent(EventExplore, (event) => {
      this.setExplorationType(ExplorationType.SINGLE_SERVICE, { serviceName: event.payload.params.serviceName });
    });

    const selectSub = this.subscribeToEvent(EventSelect, (event) => {
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
    this.setState({
      explorationType,
      body: SceneProfilesExplorer.buildBody(explorationType, initialBodyState),
    });
  }

  static buildBody(explorationType: ExplorationType, initialBodyState: any = {}) {
    let primary;

    switch (explorationType) {
      case ExplorationType.SINGLE_SERVICE:
        primary = new SceneExploreSingleService(initialBodyState);
        break;

      case ExplorationType.SINGLE_SERVICE_DETAILS:
        primary = new SceneServiceDetails(initialBodyState);
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

  onChangeExplorationType(explorationType: ExplorationType) {
    this.setExplorationType(explorationType);
  }

  static Component({ model }: SceneComponentProps<SceneProfilesExplorer>) {
    const styles = useStyles2(getStyles); // eslint-disable-line react-hooks/rules-of-hooks
    const { controls, body, explorationType } = model.useState();

    const [variablesControl, timePickerControl, refreshPickerControl] = controls || [];

    return (
      <>
        <div className={styles.header}>
          <div className={styles.controls}>
            <Stack justifyContent="space-between" gap={1}>
              <div className={styles.variables}>
                <variablesControl.Component key={variablesControl.state.key} model={variablesControl} />

                <div className={styles.explorationType}>
                  <InlineLabel
                    width="auto"
                    tooltip={
                      <div className={styles.tooltipContent}>
                        <dl>
                          <dt>All</dt>
                          <dd>Overview of all your services, for a given profile metric</dd>
                          <dt>Single</dt>
                          <dd>Overview of a specific service, with all its profile metrics</dd>
                          <dt>Details</dt>
                          <dd>Detailled view a specific service, with its flame graph</dd>
                          <dt>Favorites</dt>
                          <dd>Overview of your favorite visualizations</dd>
                        </dl>
                      </div>
                    }
                  >
                    Choose your exploration type
                  </InlineLabel>
                  <RadioButtonGroup
                    options={SceneProfilesExplorer.EXPLORATION_TYPE_OPTIONS}
                    value={explorationType}
                    fullWidth={false}
                    onChange={model.onChangeExplorationType}
                  />
                </div>
              </div>
              <Stack>
                <timePickerControl.Component key={timePickerControl.state.key} model={timePickerControl} />
                <refreshPickerControl.Component key={refreshPickerControl.state.key} model={refreshPickerControl} />
              </Stack>
            </Stack>
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
    padding: 0 0 ${theme.spacing(1)};
  `,
  variables: css`
    display: flex;
    gap: ${theme.spacing(1)};
  `,
  explorationType: css`
    display: flex;
  `,
  tooltipContent: css`
    padding: ${theme.spacing(1)};

    & dt {
      font-weight: ${theme.typography.fontWeightBold};
    }

    & dd {
      margin: 0 0 4px ${theme.spacing(1)};
    }
  `,
  body: css`
    position: relative;
    z-index: 0;
    margin-top: ${theme.spacing(1)};
    background: transparent;
  `,
});
