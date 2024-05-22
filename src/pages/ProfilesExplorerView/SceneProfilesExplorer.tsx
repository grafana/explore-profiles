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
  SceneVariableSet,
  SplitLayout,
  VariableValueSelectors,
} from '@grafana/scenes';
import { Stack, Tab, TabContent, TabsBar, useStyles2 } from '@grafana/ui';
import { displayError } from '@shared/domain/displayStatus';
import { ProfileMetric } from '@shared/infrastructure/profile-metrics/getProfileMetric';
import { servicesApiClient } from '@shared/infrastructure/services/servicesApiClient';
import React from 'react';

import { SceneExploreFavorites } from './SceneExploreFavorites/SceneExploreFavorites';
import { SceneExploreProfileMetrics } from './SceneExploreProfileMetrics/SceneExploreProfileMetrics';
import { SceneExploreServices } from './SceneExploreServices/SceneExploreServices';
import { ProfilesDataSourceVariable } from './variables/ProfilesDataSourceVariable';

enum MainTab {
  EXPLORE_SERVICES = 'explore-services',
  EXPLORE_PROFILE_METRICS = 'explore-profile-metrics',
  EXPLORE_FAVORITES = 'explore-favorites',
}

export interface SceneProfilesExplorerState extends Partial<EmbeddedSceneState> {
  mainTab: MainTab;
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
  static DEFAULT_TAB = MainTab.EXPLORE_SERVICES;

  protected _urlSync = new SceneObjectUrlSyncConfig(this, { keys: ['mainTab'] });

  constructor() {
    const $timeRange = new SceneTimeRange({});

    super({
      key: 'profiles-explorer',
      mainTab: SceneProfilesExplorer.DEFAULT_TAB,
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
        variables: [new ProfilesDataSourceVariable({})],
      }),
      controls: [
        new VariableValueSelectors({}),
        new SceneTimePicker({ isOnCanvas: true }),
        new SceneRefreshPicker({ isOnCanvas: true }),
      ],
    });

    this.addActivationHandler(() => {
      this.setState({
        body: SceneProfilesExplorer.buildBody(this.state.mainTab),
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

  static buildBody(mainTab: MainTab) {
    let primary;

    switch (mainTab) {
      case MainTab.EXPLORE_SERVICES:
        primary = new SceneExploreServices();
        break;

      case MainTab.EXPLORE_PROFILE_METRICS:
        primary = new SceneExploreProfileMetrics();
        break;

      case MainTab.EXPLORE_FAVORITES:
        primary = new SceneExploreFavorites();
        break;

      default:
        throw new Error(`Unknown tab "${mainTab}"!`);
    }

    return new SplitLayout({
      direction: 'column',
      primary,
    });
  }

  getUrlState() {
    return {
      mainTab: this.state.mainTab,
    };
  }

  updateFromUrl(values: SceneObjectUrlValues) {
    const stateUpdate: Partial<SceneProfilesExplorerState> = {};

    if (values.mainTab !== this.state.mainTab) {
      stateUpdate.mainTab = Object.values(MainTab).includes(values.mainTab as MainTab)
        ? (values.mainTab as MainTab)
        : SceneProfilesExplorer.DEFAULT_TAB;
    }

    this.setState(stateUpdate);
  }

  selectMainTab(mainTab: MainTab) {
    this.setState({
      mainTab,
      body: SceneProfilesExplorer.buildBody(mainTab),
    });

    this.refreshServicesAndProfileMetrics();
  }

  static Component({ model }: SceneComponentProps<SceneProfilesExplorer>) {
    const styles = useStyles2(getStyles); // eslint-disable-line react-hooks/rules-of-hooks
    const { controls, mainTab, body } = model.useState();

    const [variablesControl, timePickerControl, refreshPickerControl] = controls || [];

    return (
      <>
        <div className={styles.header}>
          <div className={styles.controls}>
            <Stack justifyContent="space-between">
              <div>
                <variablesControl.Component key={variablesControl.state.key} model={variablesControl} />
              </div>
              <Stack>
                <timePickerControl.Component key={timePickerControl.state.key} model={timePickerControl} />
                <refreshPickerControl.Component key={refreshPickerControl.state.key} model={refreshPickerControl} />
              </Stack>
            </Stack>
          </div>
        </div>

        <TabsBar>
          <Tab
            label="Explore services"
            active={mainTab === MainTab.EXPLORE_SERVICES}
            onChangeTab={() => model.selectMainTab(MainTab.EXPLORE_SERVICES)}
          />
          <Tab
            label="Explore profile metrics"
            active={mainTab === MainTab.EXPLORE_PROFILE_METRICS}
            onChangeTab={() => model.selectMainTab(MainTab.EXPLORE_PROFILE_METRICS)}
          />
          <Tab
            label="Favorites"
            active={mainTab === MainTab.EXPLORE_FAVORITES}
            onChangeTab={() => model.selectMainTab(MainTab.EXPLORE_FAVORITES)}
          />
        </TabsBar>

        <TabContent className={styles.tabContent}>{body && <body.Component model={body} />}</TabContent>
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
    margin-bottom: ${theme.spacing(1)};
  `,
  controls: css`
    padding: 0 0 ${theme.spacing(2)};
  `,
  tabContent: css`
    position: relative;
    z-index: 0;
    margin-top: ${theme.spacing(1)};
    padding-top: ${theme.spacing(1)};
    background: transparent;
  `,
});
