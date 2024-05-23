import { css } from '@emotion/css';
import { GrafanaTheme2 } from '@grafana/data';
import {
  EmbeddedSceneState,
  SceneComponentProps,
  SceneObjectBase,
  SceneRefreshPicker,
  SceneTimePicker,
  SceneTimeRange,
  SceneVariable,
  SceneVariableSet,
  SplitLayout,
  VariableDependencyConfig,
  VariableValueSelectors,
} from '@grafana/scenes';
import { Stack, useStyles2 } from '@grafana/ui';
import { displayError } from '@shared/domain/displayStatus';
import { ProfileMetric } from '@shared/infrastructure/profile-metrics/getProfileMetric';
import { servicesApiClient } from '@shared/infrastructure/services/servicesApiClient';
import React from 'react';

import { SceneExploreAllServices } from './SceneExploreAllServices/SceneExploreAllServices';
import { SceneExploreFavorites } from './SceneExploreFavorites/SceneExploreFavorites';
import { SceneExploreSingleService } from './SceneExploreSingleService/SceneExploreSingleService';
import { ExplorationTypeVariable } from './variables/ExplorationTypeVariable';
import { ProfilesDataSourceVariable } from './variables/ProfilesDataSourceVariable';

export interface SceneProfilesExplorerState extends Partial<EmbeddedSceneState> {
  explorationType: string;
  services: {
    data: string[];
    isLoading: boolean;
    error: Error | null;
  };
  profileMetrics: {
    data: Array<{
      value: string;
      label: string;
      type: string;
      group: string;
    }>;
    isLoading: boolean;
    error: Error | null;
  };
  body?: SplitLayout;
}

export class SceneProfilesExplorer extends SceneObjectBase<SceneProfilesExplorerState> {
  protected _variableDependency = new VariableDependencyConfig(this, {
    variableNames: ['explorationType'],
    onReferencedVariableValueChanged: this.selectExplorationType.bind(this),
  });

  constructor() {
    const $timeRange = new SceneTimeRange({});

    super({
      key: 'profiles-explorer',
      explorationType: ExplorationTypeVariable.DEFAULT_VALUE,
      body: undefined,
      services: {
        data: [],
        isLoading: false,
        error: null,
      },
      profileMetrics: {
        data: [],
        isLoading: false,
        error: null,
      },
      $timeRange,
      $variables: new SceneVariableSet({
        variables: [new ProfilesDataSourceVariable({}), new ExplorationTypeVariable()],
      }),
      controls: [
        new VariableValueSelectors({}),
        new SceneTimePicker({ isOnCanvas: true }),
        new SceneRefreshPicker({ isOnCanvas: true }),
      ],
    });

    this.addActivationHandler(() => {
      const explorationType =
        (this.state.$variables?.getByName('explorationType')?.getValue() as string) ||
        ExplorationTypeVariable.DEFAULT_VALUE;

      this.setState({
        explorationType,
        body: SceneProfilesExplorer.buildBody(explorationType),
      });

      // we fetch services only here and...
      this.refreshServicesAndProfileMetrics();

      // ...only when selecting a new tab and only when refreshing the time range, to improve UX.
      // if not, the whole services list gets re-rendered whenever the user zooms selects a time range
      // (via the time range picker or directly by selecting a range on a timeseries)
      const originalRefresh = $timeRange.onRefresh;

      // TODO: remove hack - how?
      $timeRange.onRefresh = (...args) => {
        originalRefresh(...args);
        this.refreshServicesAndProfileMetrics();
      };

      return () => {
        $timeRange.onRefresh = originalRefresh;
        servicesApiClient.abort();
      };
    });
  }

  async refreshServicesAndProfileMetrics() {
    let services;
    const timeRangeState = this.state.$timeRange!.state;

    this.setState({
      services: {
        data: [],
        isLoading: true,
        error: null,
      },
      profileMetrics: {
        data: [],
        isLoading: true,
        error: null,
      },
    });

    try {
      // hack because SceneTimeRange updates the URL in UTC format (e.g. 2024-05-21T10:58:03.805Z)
      services = await servicesApiClient.list({
        timeRange: {
          raw: {
            from: timeRangeState.value.from,
            to: timeRangeState.value.to,
          },
          from: timeRangeState.value.from,
          to: timeRangeState.value.to,
        },
      });
    } catch (error) {
      displayError(error, [
        'Error while fetching the services list! Sorry for the inconvenience. Please try reloading the page.',
        (error as Error).message,
      ]);

      this.setState({
        services: {
          data: [],
          isLoading: false,
          error: error as Error,
        },
        profileMetrics: {
          data: [],
          isLoading: false,
          error: error as Error,
        },
      });

      return;
    }

    const allProfileMetricsMap = new Map<ProfileMetric['id'], ProfileMetric>();

    for (const profileMetrics of services.values()) {
      for (const [id, metric] of profileMetrics) {
        allProfileMetricsMap.set(id, metric);
      }
    }

    this.setState({
      services: {
        data: Array.from(services.keys()).sort((a, b) => a.localeCompare(b)),
        isLoading: false,
        error: null,
      },
      profileMetrics: {
        data: Array.from(allProfileMetricsMap.values())
          .sort((a, b) => a.type.localeCompare(b.type))
          .map(({ id, type, group }) => ({
            value: id,
            label: `${type} (${group})`,
            type,
            group,
          })),
        isLoading: false,
        error: null,
      },
    });
  }

  static buildBody(explorationType: string) {
    let primary;

    switch (explorationType) {
      case 'all-services-exploration':
        primary = new SceneExploreAllServices();
        break;

      case 'single-service-exploration':
        primary = new SceneExploreSingleService();
        break;

      case 'favorites-exploration':
        primary = new SceneExploreFavorites();
        break;

      default:
        throw new Error(`Unknown exploration type "${explorationType}"!`);
    }

    return new SplitLayout({
      direction: 'column',
      primary,
    });
  }

  selectExplorationType(explorationTypeVariable: SceneVariable) {
    const explorationType = explorationTypeVariable.getValue() as string;

    this.setState({
      explorationType,
      body: SceneProfilesExplorer.buildBody(explorationType),
    });

    this.refreshServicesAndProfileMetrics();
  }

  static Component({ model }: SceneComponentProps<SceneProfilesExplorer>) {
    const styles = useStyles2(getStyles); // eslint-disable-line react-hooks/rules-of-hooks
    const { controls, body } = model.useState();

    const [variablesControl, timePickerControl, refreshPickerControl] = controls || [];

    return (
      <>
        <div className={styles.header}>
          <div className={styles.controls}>
            <Stack justifyContent="space-between">
              <div className={styles.variables}>
                <variablesControl.Component key={variablesControl.state.key} model={variablesControl} />
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
  body: css`
    position: relative;
    z-index: 0;
    margin-top: ${theme.spacing(1)};
    background: transparent;
  `,
});
