import { css } from '@emotion/css';
import { createTheme, GrafanaTheme2, LoadingState, TimeRange } from '@grafana/data';
import { FlameGraph } from '@grafana/flamegraph';
import { SceneComponentProps, SceneObjectBase, SceneObjectState, SceneQueryRunner } from '@grafana/scenes';
import { Spinner, useStyles2, useTheme2 } from '@grafana/ui';
import { FunctionDetailsPanel } from '@shared/components/FunctionDetailsPanel/FunctionDetailsPanel';
import { displayWarning } from '@shared/domain/displayStatus';
import { useGitHubIntegration } from '@shared/domain/github-integration/useGitHubIntegration';
import { useMaxNodesFromUrl } from '@shared/domain/url-params/useMaxNodesFromUrl';
import { useToggleSidePanel } from '@shared/domain/useToggleSidePanel';
import { getProfileMetric, ProfileMetricId } from '@shared/infrastructure/profile-metrics/getProfileMetric';
import { useFetchPluginSettings } from '@shared/infrastructure/settings/useFetchPluginSettings';
import { timelineAndProfileApiClient } from '@shared/infrastructure/timeline-profile/timelineAndProfileApiClient';
import { DomainHookReturnValue } from '@shared/types/DomainHookReturnValue';
import { Panel } from '@shared/ui/Panel/Panel';
import React, { useEffect, useMemo } from 'react';
import { Unsubscribable } from 'rxjs';

import { useBuildPyroscopeQuery } from '../../domain/useBuildPyroscopeQuery';
import { getSceneVariableValue } from '../../helpers/getSceneVariableValue';
import { buildFlameGraphQueryRunner } from '../../infrastructure/flame-graph/buildFlameGraphQueryRunner';
import { PYROSCOPE_DATA_SOURCE } from '../../infrastructure/pyroscope-data-sources';
import { AIButton } from '../SceneAiPanel/components/AiButton/AIButton';
import { SceneAiPanel } from '../SceneAiPanel/SceneAiPanel';

interface SceneFlameGraphState extends SceneObjectState {
  $data: SceneQueryRunner;
  lastTimeRange?: TimeRange;
  aiPanel: SceneAiPanel;
}

// I've tried to use a SplitLayout for the body without any success (left: flame graph, right: explain flame graph content)
// without success: the flame graph dimensions are set in runtime and do not change when the user resizes the layout
export class SceneFlameGraph extends SceneObjectBase<SceneFlameGraphState> {
  constructor() {
    super({
      key: 'flame-graph',
      $data: new SceneQueryRunner({
        datasource: PYROSCOPE_DATA_SOURCE,
        queries: [],
      }),
      lastTimeRange: undefined,
      aiPanel: new SceneAiPanel({ isDiff: false }),
    });

    this.addActivationHandler(this.onActivate.bind(this));
  }

  onActivate() {
    let dataSubscription: Unsubscribable | undefined;

    const stateSubscription = this.subscribeToState((newState, prevState) => {
      if (newState.$data === prevState.$data) {
        return;
      }

      if (dataSubscription) {
        dataSubscription.unsubscribe();
      }

      dataSubscription = newState.$data?.subscribeToState((newDataState) => {
        if (newDataState.data?.state === LoadingState.Done) {
          const lastTimeRange = newDataState.data.timeRange;

          // For the "Function Details" feature only
          timelineAndProfileApiClient.setLastTimeRange(lastTimeRange);

          this.setState({ lastTimeRange });
        }
      });
    });

    return () => {
      stateSubscription.unsubscribe();
      dataSubscription?.unsubscribe();
    };
  }

  buildTitle() {
    const serviceName = getSceneVariableValue(this, 'serviceName');
    const profileMetricId = getSceneVariableValue(this, 'profileMetricId');
    const profileMetricType = getProfileMetric(profileMetricId as ProfileMetricId).type;

    return `🔥 Flame graph for ${serviceName} (${profileMetricType})`;
  }

  useSceneFlameGraph = (): DomainHookReturnValue => {
    const { isLight } = useTheme2();
    const getTheme = useMemo(() => () => createTheme({ colors: { mode: isLight ? 'light' : 'dark' } }), [isLight]);

    const [maxNodes] = useMaxNodesFromUrl();
    const { settings, error: isFetchingSettingsError } = useFetchPluginSettings();
    const { $data, aiPanel, lastTimeRange } = this.useState();

    if (isFetchingSettingsError) {
      displayWarning([
        'Error while retrieving the plugin settings!',
        'Some features might not work as expected (e.g. collapsed flame graphs). Please try to reload the page, sorry for the inconvenience.',
      ]);
    }

    useEffect(() => {
      if (maxNodes) {
        this.setState({
          $data: buildFlameGraphQueryRunner({ maxNodes }),
        });
      }
    }, [maxNodes]);

    const $dataState = $data.useState();
    const isFetchingProfileData = $dataState?.data?.state === LoadingState.Loading;
    const profileData = $dataState?.data?.series?.[0];
    const hasProfileData = Number(profileData?.length) > 1;

    const query = useBuildPyroscopeQuery(this, 'filters');

    return {
      data: {
        title: this.buildTitle(),
        isLoading: isFetchingProfileData,
        isFetchingProfileData,
        hasProfileData,
        profileData,
        settings,
        ai: {
          panel: aiPanel,
          params: [{ query, timeRange: lastTimeRange }],
        },
      },
      actions: {
        getTheme,
      },
    };
  };

  static Component = ({ model }: SceneComponentProps<SceneFlameGraph>) => {
    const styles = useStyles2(getStyles);

    const { data, actions } = model.useSceneFlameGraph();
    const sidePanel = useToggleSidePanel();
    const gitHubIntegration = useGitHubIntegration(sidePanel);

    const isAiButtonDisabled = data.isLoading || !data.hasProfileData;

    useEffect(() => {
      if (isAiButtonDisabled) {
        sidePanel.close();
      }
    }, [isAiButtonDisabled, sidePanel]);

    const panelTitle = useMemo(
      () => (
        <>
          {data.title}
          {data.isLoading && <Spinner inline className={styles.spinner} />}
        </>
      ),
      [data.isLoading, data.title, styles.spinner]
    );

    return (
      <div className={styles.flex}>
        <Panel
          className={styles.flamegraphPanel}
          title={panelTitle}
          isLoading={data.isLoading}
          headerActions={
            <AIButton
              disabled={isAiButtonDisabled || sidePanel.isOpen('ai')}
              onClick={() => sidePanel.open('ai')}
              interactionName="g_pyroscope_app_explain_flamegraph_clicked"
            >
              Explain Flame Graph
            </AIButton>
          }
        >
          <FlameGraph
            data={data.profileData as any}
            disableCollapsing={!data.settings?.collapsedFlamegraphs}
            getTheme={actions.getTheme as any}
            getExtraContextMenuButtons={gitHubIntegration.actions.getExtraFlameGraphMenuItems}
          />
        </Panel>

        {sidePanel.isOpen('ai') && (
          <data.ai.panel.Component model={data.ai.panel} params={data.ai.params} onClose={sidePanel.close} />
        )}

        {sidePanel.isOpen('function-details') && (
          <FunctionDetailsPanel
            className={styles.sidePanel}
            stacktrace={gitHubIntegration.data.stacktrace}
            onClose={sidePanel.close}
          />
        )}
      </div>
    );
  };
}

const getStyles = (theme: GrafanaTheme2) => ({
  flex: css`
    display: flex;
  `,
  flamegraphPanel: css`
    min-width: 0;
    flex-grow: 1;
  `,
  sidePanel: css`
    flex: 1 0 50%;
    margin-left: 8px;
    max-width: calc(50% - 4px);
  `,
  spinner: css`
    margin-left: ${theme.spacing(1)};
  `,
});
