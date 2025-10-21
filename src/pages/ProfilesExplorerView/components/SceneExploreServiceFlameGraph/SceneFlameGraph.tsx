import { css } from '@emotion/css';
import { useAssistant } from '@grafana/assistant';
import { createTheme, GrafanaTheme2, LoadingState, TimeRange } from '@grafana/data';
import { FlameGraph, Props as FlameGraphProps } from '@grafana/flamegraph';
import { SceneComponentProps, SceneObjectBase, SceneObjectState, SceneQueryRunner } from '@grafana/scenes';
import { Spinner, useStyles2, useTheme2 } from '@grafana/ui';
import { displayWarning } from '@shared/domain/displayStatus';
import { useMaxNodesFromUrl } from '@shared/domain/url-params/useMaxNodesFromUrl';
import { useToggleSidePanel } from '@shared/domain/useToggleSidePanel';
import { getProfileMetric, ProfileMetricId } from '@shared/infrastructure/profile-metrics/getProfileMetric';
import { featureToggles } from '@shared/infrastructure/settings/featureToggles';
import { useFetchPluginSettings } from '@shared/infrastructure/settings/useFetchPluginSettings';
import { DomainHookReturnValue } from '@shared/types/DomainHookReturnValue';
import { InlineBanner } from '@shared/ui/InlineBanner';
import { Panel } from '@shared/ui/Panel/Panel';
import { PyroscopeLogo } from '@shared/ui/PyroscopeLogo';
import React, { useEffect, useMemo, useState } from 'react';
import { Unsubscribable } from 'rxjs';

import { useBuildPyroscopeQuery } from '../../domain/useBuildPyroscopeQuery';
import { getSceneVariableValue } from '../../helpers/getSceneVariableValue';
import { buildFlameGraphQueryRunner } from '../../infrastructure/flame-graph/buildFlameGraphQueryRunner';
import { PYROSCOPE_DATA_SOURCE } from '../../infrastructure/pyroscope-data-sources';
import { AIButton } from '../SceneAiPanel/components/AiButton/AIButton';
import { SceneAiPanel } from '../SceneAiPanel/SceneAiPanel';
import { useCreateRecordingRulesMenu } from '../SceneCreateMetricModal/domain/useMenuOption';
import { SceneCreateRecordingRuleModal } from '../SceneCreateMetricModal/SceneCreateRecordingRuleModal';
import { SceneExportMenu } from './components/SceneExportMenu/SceneExportMenu';
import { useGitHubIntegration } from './components/SceneFunctionDetailsPanel/domain/useGitHubIntegration';
import { SceneFunctionDetailsPanel } from './components/SceneFunctionDetailsPanel/SceneFunctionDetailsPanel';
import { RemoveSpanSelector } from './domain/events/RemoveSpanSelector';
import { SpanSelectorLabel } from './SpanSelectorLabel';

interface SceneFlameGraphState extends SceneObjectState {
  $data: SceneQueryRunner;
  lastTimeRange?: TimeRange;
  exportMenu: SceneExportMenu;
  aiPanel: SceneAiPanel;
  functionDetailsPanel: SceneFunctionDetailsPanel;
  createRecordingRuleModal: SceneCreateRecordingRuleModal;
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
      createRecordingRuleModal: new SceneCreateRecordingRuleModal(),
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

  useSceneFlameGraph = (spanSelector: string): DomainHookReturnValue => {
    const { isLight } = useTheme2();
    const getTheme = useMemo(() => () => createTheme({ colors: { mode: isLight ? 'light' : 'dark' } }), [isLight]);

    const [maxNodes] = useMaxNodesFromUrl();
    const { settings, error: isFetchingSettingsError } = useFetchPluginSettings();
    const { $data, lastTimeRange, exportMenu, aiPanel, functionDetailsPanel, createRecordingRuleModal } =
      this.useState();

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
        recordingRules: {
          modal: createRecordingRuleModal,
        },
      },
      actions: {
        getTheme,
      },
    };
  };

  removeSpanSelector() {
    this.publishEvent(new RemoveSpanSelector({}), true);
  }

  static Component = ({ model }: SceneComponentProps<SceneFlameGraph>) => {
    const styles = useStyles2(getStyles);

    const spanSelector = getSceneVariableValue(model, 'spanSelector');
    const { data, actions } = model.useSceneFlameGraph(spanSelector);
    const sidePanel = useToggleSidePanel();
    const gitHubIntegration = useGitHubIntegration(sidePanel);

    const { settings } = useFetchPluginSettings();

    const [recordingRulesModalState, setRecordingRulesModalState] = useState<{
      isOpen: boolean;
      functionName?: string;
    }>({ isOpen: false });

    const recordingRulesMenu = useCreateRecordingRulesMenu((functionName?: string) => {
      setRecordingRulesModalState({ isOpen: true, functionName });
    });

    // Do not show AI button if the assistant integration is enabled to avoid having two AI buttons in the UI
    // For debugging purposes and comparing both you can use localStorage flag grafana-pyroscope-app.forceShowAiButton
    const { isAvailable } = useAssistant();
    const hideAIButton =
      featureToggles.grafanaAssistantInProfilesDrilldown &&
      isAvailable &&
      !localStorage.getItem('grafana-pyroscope-app.forceShowAIButton');

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

    const extraContextMenuButtons: FlameGraphProps['getExtraContextMenuButtons'] = (clickedItemData, data) => {
      const ghButtons = gitHubIntegration.actions.getExtraFlameGraphMenuItems(clickedItemData, data);
      const recordingRulesButtons =
        settings?.enableMetricsFromProfiles && featureToggles.metricsFromProfiles
          ? recordingRulesMenu.actions.getExtraFlameGraphMenuItems(clickedItemData, data)
          : [];

      return [...ghButtons, ...recordingRulesButtons];
    };

    return (
      <div className={styles.flex}>
        <Panel
          dataTestId="flame-graph-panel"
          className={styles.flamegraphPanel}
          title={panelTitle}
          isLoading={data.isLoading}
          headerActions={
            <>
              {spanSelector && (
                <SpanSelectorLabel spanSelector={spanSelector} removeSpanSelector={() => model.removeSpanSelector()} />
              )}
              {!hideAIButton && (
                <AIButton
                  disabled={isAiButtonDisabled || sidePanel.isOpen('ai')}
                  onClick={() => sidePanel.open('ai')}
                  interactionName="g_pyroscope_app_explain_flamegraph_clicked"
                >
                  Explain Flame Graph
                </AIButton>
              )}
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
              getExtraContextMenuButtons={extraContextMenuButtons}
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

        <data.recordingRules.modal.Component
          model={data.recordingRules.modal}
          isModalOpen={recordingRulesModalState.isOpen}
          functionName={recordingRulesModalState.functionName}
          onDismiss={() => setRecordingRulesModalState({ isOpen: false })}
          onCreated={() => {
            setRecordingRulesModalState({ isOpen: false });
          }}
        />
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
