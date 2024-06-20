import { css } from '@emotion/css';
import { createTheme, GrafanaTheme2, LoadingState } from '@grafana/data';
import { FlameGraph } from '@grafana/flamegraph';
import { SceneComponentProps, SceneObjectBase, SceneObjectState, SceneQueryRunner, VizPanel } from '@grafana/scenes';
import { Spinner, useStyles2, useTheme2 } from '@grafana/ui';
import { AiPanel } from '@shared/components/AiPanel/AiPanel';
import { AIButton } from '@shared/components/AiPanel/components/AIButton';
import { FunctionDetailsPanel } from '@shared/components/FunctionDetailsPanel/FunctionDetailsPanel';
import { Panel } from '@shared/components/Panel';
import { displayWarning } from '@shared/domain/displayStatus';
import { useGitHubIntegration } from '@shared/domain/github-integration/useGitHubIntegration';
import { useToggleSidePanel } from '@shared/domain/useToggleSidePanel';
import { useFetchPluginSettings } from '@shared/infrastructure/settings/useFetchPluginSettings';
import { DomainHookReturnValue } from '@shared/types/DomainHookReturnValue';
import React, { useEffect, useMemo } from 'react';

import { buildFlameGraphQueryRunner } from '../data/flame-graph/buildFlameGraphQueryRunner';
import { PYROSCOPE_DATA_SOURCE } from '../data/pyroscope-data-sources';
import { findSceneObjectByKey } from '../helpers/findSceneObjectByKey';

interface SceneFlameGraphState extends SceneObjectState {
  title?: string;
}

// I've tried to use a SplitLayout for the body without any success (left: flame graph, right: explain flame graph content)
// without success: the flame graph dimensions are set in runtime and do not change when the user resizes the layout
export class SceneFlameGraph extends SceneObjectBase<SceneFlameGraphState> {
  constructor() {
    super({
      key: 'flame-graph',
      title: undefined,
      $data: new SceneQueryRunner({
        datasource: PYROSCOPE_DATA_SOURCE,
        queries: [],
      }),
    });

    this.addActivationHandler(this.onActivate.bind(this));
  }

  onActivate() {
    const timeSeriesPanel = findSceneObjectByKey(this, 'service-details-timeseries') as VizPanel;

    this.setState({ title: timeSeriesPanel.state.title });

    timeSeriesPanel.subscribeToState((newState) => {
      if (this.state.title !== newState.title) {
        this.setState({ title: newState.title });
      }
    });
  }

  useSceneFlameGraph = (): DomainHookReturnValue => {
    const { isLight } = useTheme2();
    const getTheme = useMemo(() => () => createTheme({ colors: { mode: isLight ? 'light' : 'dark' } }), [isLight]);

    const { settings, error: isFetchingSettingsError } = useFetchPluginSettings();
    const { $data, title } = this.useState();

    useEffect(() => {
      if (isFetchingSettingsError) {
        displayWarning([
          'Error while retrieving the plugin settings!',
          'Some features might not work as expected (e.g. collapsed flame graphs). Please try to reload the page, sorry for the inconvenience.',
        ]);
      } else if (settings) {
        this.setState({
          $data: buildFlameGraphQueryRunner({ maxNodes: settings?.maxNodes }),
        });
      }
    }, [isFetchingSettingsError, settings]);

    const $dataState = $data!.useState();
    const isFetchingProfileData = $dataState?.data?.state === LoadingState.Loading;
    const profileData = $dataState?.data?.series[0];
    const hasProfileData = Number(profileData?.length) > 1;

    return {
      data: {
        timeSeriesTitle: title,
        isLoading: isFetchingProfileData,
        isFetchingProfileData,
        hasProfileData,
        profileData,
        settings,
      },
      actions: {
        getTheme,
      },
    };
  };

  static Component = ({ model }: SceneComponentProps<SceneFlameGraph>) => {
    const styles = useStyles2(getStyles);

    const sidePanel = useToggleSidePanel();
    const { data, actions } = model.useSceneFlameGraph();
    const gitHubIntegration = useGitHubIntegration(sidePanel);

    useEffect(() => {
      sidePanel.onOpen(() => {
        // crazy hack to have both panels occupy properly 50% of their parent
        // if not, the flame graph panel includes the table and a bit of the flame graph (?!) and the
        // side panel goes out of the boundaries of the viewport
        // TODO: fix with useResizeObserver?
        (document.querySelector('label[title="Only show flame graph"]') as HTMLElement)?.click();
      });
    }, [sidePanel]);

    useEffect(() => {
      if (data.isLoading) {
        sidePanel.close();
      }
    }, [data.isLoading, sidePanel]);

    const panelTitle = useMemo(
      () => (
        <>
          {data.timeSeriesTitle}
          {data.isLoading && <Spinner inline className={styles.spinner} />}
        </>
      ),
      [data.isLoading, data.timeSeriesTitle, styles.spinner]
    );

    return (
      <div className={styles.flex}>
        <Panel
          className={styles.flamegraphPanel}
          title={panelTitle}
          isLoading={data.isLoading}
          headerActions={
            <AIButton
              className={styles.aiButton}
              onClick={() => {
                sidePanel.open('ai');
              }}
              disabled={data.isLoading || !data.hasProfileData || sidePanel.isOpen('ai')}
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

        {sidePanel.isOpen('ai') && <AiPanel className={styles.sidePanel} onClose={sidePanel.close} />}

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
    gap: ${theme.spacing(1)};
    width: 100%;
  `,
  flamegraphPanel: css`
    min-width: 50%;
    flex-grow: 1;
  `,
  sidePanel: css`
    flex: 1 0 50%;
    max-width: 50%;
  `,
  spinner: css`
    margin-left: ${theme.spacing(1)};
  `,
  aiButton: css`
    margin-top: ${theme.spacing(1)};
  `,
});
