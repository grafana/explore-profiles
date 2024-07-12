import { css } from '@emotion/css';
import { createTheme, GrafanaTheme2, LoadingState } from '@grafana/data';
import { FlameGraph } from '@grafana/flamegraph';
import { SceneComponentProps, SceneObjectBase, SceneObjectState, SceneQueryRunner, VizPanel } from '@grafana/scenes';
import { Spinner, useStyles2, useTheme2 } from '@grafana/ui';
import { AiPanel } from '@shared/components/AiPanel/AiPanel';
import { AIButton } from '@shared/components/AiPanel/components/AIButton';
import { FunctionDetailsPanel } from '@shared/components/FunctionDetailsPanel/FunctionDetailsPanel';
import { displayWarning } from '@shared/domain/displayStatus';
import { useGitHubIntegration } from '@shared/domain/github-integration/useGitHubIntegration';
import { useMaxNodesFromUrl } from '@shared/domain/url-params/useMaxNodesFromUrl';
import { useToggleSidePanel } from '@shared/domain/useToggleSidePanel';
import { useFetchPluginSettings } from '@shared/infrastructure/settings/useFetchPluginSettings';
import { DomainHookReturnValue } from '@shared/types/DomainHookReturnValue';
import { Panel } from '@shared/ui/Panel/Panel';
import React, { useEffect, useMemo } from 'react';

import { buildFlameGraphQueryRunner } from '../../data/flame-graph/buildFlameGraphQueryRunner';
import { PYROSCOPE_DATA_SOURCE } from '../../data/pyroscope-data-sources';
import { findSceneObjectByKey } from '../../helpers/findSceneObjectByKey';

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
    const mainServiceTimeseries = findSceneObjectByKey(this, 'main-service-timeseries') as VizPanel;

    this.setState({ title: mainServiceTimeseries.state.title });

    mainServiceTimeseries.subscribeToState((newState) => {
      if (this.state.title !== newState.title) {
        this.setState({ title: newState.title });
      }
    });
  }

  useSceneFlameGraph = (): DomainHookReturnValue => {
    const { isLight } = useTheme2();
    const getTheme = useMemo(() => () => createTheme({ colors: { mode: isLight ? 'light' : 'dark' } }), [isLight]);

    const [maxNodes] = useMaxNodesFromUrl();
    const { settings, error: isFetchingSettingsError } = useFetchPluginSettings();
    const { $data, title } = this.useState();

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

    const $dataState = $data!.useState();
    const isFetchingProfileData = $dataState?.data?.state === LoadingState.Loading;
    const profileData = $dataState?.data?.series?.[0];
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
  aiButton: css`
    margin-top: ${theme.spacing(1)};
  `,
});
