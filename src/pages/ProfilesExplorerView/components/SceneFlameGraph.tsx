import { css } from '@emotion/css';
import { createTheme, GrafanaTheme2, LoadingState } from '@grafana/data';
import { FlameGraph } from '@grafana/flamegraph';
import { SceneComponentProps, SceneObjectBase, SceneObjectState, VariableDependencyConfig } from '@grafana/scenes';
import { Spinner, useStyles2, useTheme2 } from '@grafana/ui';
import { AiPanel } from '@shared/components/AiPanel/AiPanel';
import { AIButton } from '@shared/components/AiPanel/components/AIButton';
import { Panel } from '@shared/components/Panel';
import { displayWarning } from '@shared/domain/displayStatus';
import { useToggleSidePanel } from '@shared/domain/useToggleSidePanel';
import { useFetchPluginSettings } from '@shared/infrastructure/settings/useFetchPluginSettings';
import { DomainHookReturnValue } from '@shared/types/DomainHookReturnValue';
import React, { useEffect, useMemo } from 'react';

import { buildProfileQueryRunner } from '../data/buildProfileQueryRunner';
import { SceneServiceDetails } from '../SceneServiceDetails/SceneServiceDetails';
import { ProfileMetricVariable } from '../variables/ProfileMetricVariable';
import { ServiceNameVariable } from '../variables/ServiceNameVariable';

interface SceneFlameGraphState extends SceneObjectState {
  title: string;
}

// I've tried to use a SplitLayout for the body without any success (left: flame graph, right: explain flame graph content)
// without success: the flame graph dimensions are set in runtime and do not change when the user resizes the layout
export class SceneFlameGraph extends SceneObjectBase<SceneFlameGraphState> {
  protected _variableDependency = new VariableDependencyConfig(this, {
    variableNames: ['serviceName', 'profileMetricId'],
    onReferencedVariableValueChanged: () => {
      this.setState({
        title: SceneServiceDetails.buildtimeSeriesPanelTitle(
          ServiceNameVariable.find(this).getValue() as string,
          ProfileMetricVariable.find(this).getValue() as string
        ),
      });
    },
  });

  constructor() {
    super({
      key: 'flame-graph',
      title: '',
      $data: buildProfileQueryRunner({}),
    });
  }

  useSceneFlameGraph = (): DomainHookReturnValue => {
    const { isLight } = useTheme2();
    const getTheme = useMemo(() => () => createTheme({ colors: { mode: isLight ? 'light' : 'dark' } }), [isLight]);

    const { $data, title } = this.useState();
    const $dataState = $data!.useState();
    const isFetchingProfileData = $dataState.data?.state === LoadingState.Loading;
    const profileData = $dataState.data?.series[0];
    const hasProfileData = Number(profileData?.length) > 1;

    const { isFetching: isFetchingSettings, error: fetchSettingsError, settings } = useFetchPluginSettings();

    return {
      data: {
        timeSeriesTitle: title,
        isLoading: isFetchingSettings || isFetchingProfileData,
        isFetchingProfileData,
        hasProfileData,
        profileData,
        fetchSettingsError,
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

    if (data.fetchSettingsError) {
      displayWarning([
        'Error while retrieving the plugin settings!',
        'Some features might not work as expected (e.g. collapsed flame graphs). Please try to reload the page, sorry for the inconvenience.',
      ]);
    }

    const panelTitle = useMemo(
      () => (
        <>
          {data.timeSeriesTitle}
          {data.isLoading && <Spinner inline className={styles.spinner} />}
        </>
      ),
      [data.isLoading, data.timeSeriesTitle, styles.spinner]
    );

    useEffect(() => {
      if (data.isLoading) {
        sidePanel.close();
      }
    }, [data.isLoading, sidePanel]);

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
                // crazy hack to have both panels occupy properly 50% of their parent
                (document.querySelector('label[title="Only show flame graph"]') as HTMLElement)?.click();
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
            // getExtraContextMenuButtons={}
          />
        </Panel>

        {sidePanel.isOpen('ai') && <AiPanel className={styles.sidePanel} onClose={sidePanel.close} />}
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
