import { css } from '@emotion/css';
import { createTheme, GrafanaTheme2, LoadingState, TimeRange } from '@grafana/data';
import { FlameGraph } from '@grafana/flamegraph';
import { SceneComponentProps, SceneObjectBase, SceneObjectState, SceneQueryRunner } from '@grafana/scenes';
import { Spinner, useStyles2, useTheme2 } from '@grafana/ui';
import { displayWarning } from '@shared/domain/displayStatus';
import { useMaxNodesFromUrl } from '@shared/domain/url-params/useMaxNodesFromUrl';
import { useSpanSelectorFromUrl } from '@shared/domain/url-params/useSpanSelectorFromUrl';
import { useToggleSidePanel } from '@shared/domain/useToggleSidePanel';
import { getProfileMetric, ProfileMetricId } from '@shared/infrastructure/profile-metrics/getProfileMetric';
import { useFetchPluginSettings } from '@shared/infrastructure/settings/useFetchPluginSettings';
import { DomainHookReturnValue } from '@shared/types/DomainHookReturnValue';
import { InlineBanner } from '@shared/ui/InlineBanner';
import { Panel } from '@shared/ui/Panel/Panel';
import { PyroscopeLogo } from '@shared/ui/PyroscopeLogo';
import React, { useEffect, useMemo } from 'react';
import { Unsubscribable } from 'rxjs';

import { useBuildPyroscopeQuery } from '../../domain/useBuildPyroscopeQuery';
import { getSceneVariableValue } from '../../helpers/getSceneVariableValue';
import { buildFlameGraphQueryRunner } from '../../infrastructure/flame-graph/buildFlameGraphQueryRunner';
import { PYROSCOPE_DATA_SOURCE } from '../../infrastructure/pyroscope-data-sources';
import { AIButton } from '../SceneAiPanel/components/AiButton/AIButton';
import { SceneAiPanel } from '../SceneAiPanel/SceneAiPanel';
import { SceneExportMenu } from './components/SceneExportMenu/SceneExportMenu';
import { useGitHubIntegration } from './components/SceneFunctionDetailsPanel/domain/useGitHubIntegration';
import { SceneFunctionDetailsPanel } from './components/SceneFunctionDetailsPanel/SceneFunctionDetailsPanel';
import { SpanSelectorLabel } from './SpanSelectorLabel';

interface SceneFlameGraphState extends SceneObjectState {
  $data: SceneQueryRunner;
  lastTimeRange?: TimeRange;
  exportMenu: SceneExportMenu;
  aiPanel: SceneAiPanel;
  functionDetailsPanel: SceneFunctionDetailsPanel;
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
      exportMenu: new SceneExportMenu(),
      aiPanel: new SceneAiPanel(),
      functionDetailsPanel: new SceneFunctionDetailsPanel(),
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
          this.setState({ lastTimeRange: newDataState.data.timeRange });
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

    return (
      <>
        <PyroscopeLogo size="small" />
        Flame graph for {serviceName} ({profileMetricType})
      </>
    );
  }

  useSceneFlameGraph = (): DomainHookReturnValue => {
    const { isLight } = useTheme2();
    const getTheme = useMemo(() => () => createTheme({ colors: { mode: isLight ? 'light' : 'dark' } }), [isLight]);

    const [maxNodes] = useMaxNodesFromUrl();
    const [spanSelector] = useSpanSelectorFromUrl();
    const { settings, error: isFetchingSettingsError } = useFetchPluginSettings();
    const { $data, lastTimeRange, exportMenu, aiPanel, functionDetailsPanel } = this.useState();

    if (isFetchingSettingsError) {
      displayWarning([
        'Error while retrieving the plugin settings!',
        'Some features might not work as expected (e.g. collapsed flame graphs). Please try to reload the page, sorry for the inconvenience.',
      ]);
    }

    useEffect(() => {
      if (maxNodes) {
        this.setState({
          $data: buildFlameGraphQueryRunner({ maxNodes, spanSelector }),
        });
      }
    }, [maxNodes, spanSelector]);

    const $dataState = $data.useState();
    const loadingState = $dataState?.data?.state;

    const fetchProfileError =
      loadingState === LoadingState.Error
        ? ($dataState?.data?.errors?.[0] as Error) || new Error('Unknown error!')
        : null;

    const isFetchingProfileData = loadingState === LoadingState.Loading;
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
        spanSelector,
        fetchProfileError,
        settings,
        export: {
          menu: exportMenu,
          query,
          timeRange: lastTimeRange,
        },
        ai: {
          panel: aiPanel,
          fetchParams: [{ query, timeRange: lastTimeRange }],
        },
        gitHub: {
          panel: functionDetailsPanel,
          timeRange: lastTimeRange,
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
          dataTestId="flame-graph-panel"
          className={styles.flamegraphPanel}
          title={panelTitle}
          isLoading={data.isLoading}
          headerActions={
            <>
              {data.spanSelector && <SpanSelectorLabel />}
              <AIButton
                disabled={isAiButtonDisabled || sidePanel.isOpen('ai')}
                onClick={() => sidePanel.open('ai')}
                interactionName="g_pyroscope_app_explain_flamegraph_clicked"
              >
                Explain Flame Graph
              </AIButton>
            </>
          }
        >
          {data.fetchProfileError && (
            <InlineBanner severity="error" title="Error while loading profile data!" error={data.fetchProfileError} />
          )}

          {!data.fetchProfileError && (
            <FlameGraph
              data={data.profileData as any}
              disableCollapsing={!data.settings?.collapsedFlamegraphs}
              getTheme={actions.getTheme as any}
              getExtraContextMenuButtons={gitHubIntegration.actions.getExtraFlameGraphMenuItems}
              extraHeaderElements={
                <data.export.menu.Component
                  model={data.export.menu}
                  query={data.export.query}
                  timeRange={data.export.timeRange}
                />
              }
              keepFocusOnDataChange
            />
          )}
        </Panel>

        {sidePanel.isOpen('ai') && (
          <data.ai.panel.Component model={data.ai.panel} fetchParams={data.ai.fetchParams} onClose={sidePanel.close} />
        )}

        {sidePanel.isOpen('function-details') && (
          <data.gitHub.panel.Component
            model={data.gitHub.panel}
            timeRange={data.gitHub.timeRange}
            stackTrace={gitHubIntegration.data.stacktrace}
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
  spinner: css`
    margin-left: ${theme.spacing(1)};
  `,
});
