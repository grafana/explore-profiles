import { css } from '@emotion/css';
import { GrafanaTheme2 } from '@grafana/data';
import { SceneComponentProps, sceneGraph, SceneObjectBase, SceneObjectState } from '@grafana/scenes';
import { Spinner, useStyles2 } from '@grafana/ui';
import { FlameGraph } from '@shared/components/FlameGraph/FlameGraph';
import { displayWarning } from '@shared/domain/displayStatus';
import { useToggleSidePanel } from '@shared/domain/useToggleSidePanel';
import { getProfileMetric, ProfileMetricId } from '@shared/infrastructure/profile-metrics/getProfileMetric';
import { useFetchPluginSettings } from '@shared/infrastructure/settings/useFetchPluginSettings';
import { DomainHookReturnValue } from '@shared/types/DomainHookReturnValue';
import { FlamebearerProfile } from '@shared/types/FlamebearerProfile';
import { InlineBanner } from '@shared/ui/InlineBanner';
import { Panel } from '@shared/ui/Panel/Panel';
import React, { useEffect, useMemo } from 'react';

import { useBuildPyroscopeQuery } from '../../../../domain/useBuildPyroscopeQuery';
import { ProfilesDataSourceVariable } from '../../../../domain/variables/ProfilesDataSourceVariable';
import { getSceneVariableValue } from '../../../../helpers/getSceneVariableValue';
import { AIButton } from '../../../SceneAiPanel/components/AiButton/AIButton';
import { SceneAiPanel } from '../../../SceneAiPanel/SceneAiPanel';
import { SceneExploreDiffFlameGraph } from '../../SceneExploreDiffFlameGraph';
import { useFetchDiffProfile } from './infrastructure/useFetchDiffProfile';

interface SceneDiffFlameGraphState extends SceneObjectState {
  aiPanel: SceneAiPanel;
}

export class SceneDiffFlameGraph extends SceneObjectBase<SceneDiffFlameGraphState> {
  constructor() {
    super({
      key: 'diff-flame-graph',
      aiPanel: new SceneAiPanel(),
    });
  }

  buildTitle() {
    const serviceName = getSceneVariableValue(this, 'serviceName');
    const profileMetricId = getSceneVariableValue(this, 'profileMetricId');
    const profileMetricType = getProfileMetric(profileMetricId as ProfileMetricId).type;

    return `🔥 Diff flame graph for ${serviceName} (${profileMetricType})`;
  }

  useSceneDiffFlameGraph = (): DomainHookReturnValue => {
    const { aiPanel } = this.useState();
    const { baselineTimeRange, comparisonTimeRange } = (this.parent as SceneExploreDiffFlameGraph).useDiffTimeRanges();

    const baselineQuery = useBuildPyroscopeQuery(this, 'filtersBaseline');
    const comparisonQuery = useBuildPyroscopeQuery(this, 'filtersComparison');

    const { settings, error: fetchSettingsError } = useFetchPluginSettings();

    const dataSourceUid = sceneGraph.findByKeyAndType(this, 'dataSource', ProfilesDataSourceVariable).useState()
      .value as string;

    const isDiffQueryEnabled = Boolean(
      baselineQuery &&
        comparisonQuery &&
        // warning: sending zero parameters values to the API would make the pods crash
        // so we enable only when we have non-zero parameters values
        baselineTimeRange.from.unix() &&
        baselineTimeRange.to.unix() &&
        comparisonTimeRange.from.unix() &&
        comparisonTimeRange.to.unix()
    );

    const {
      isFetching,
      error: fetchProfileError,
      profile,
    } = useFetchDiffProfile({
      enabled: isDiffQueryEnabled,
      dataSourceUid,
      baselineTimeRange,
      baselineQuery,
      comparisonTimeRange,
      comparisonQuery,
    });

    const noProfileDataAvailable =
      isDiffQueryEnabled && !isFetching && !fetchProfileError && profile?.flamebearer.numTicks === 0;

    const shouldDisplayFlamegraph = Boolean(
      isDiffQueryEnabled && !fetchProfileError && !noProfileDataAvailable && profile
    );
    const shouldDisplayInfo = !isDiffQueryEnabled;

    return {
      data: {
        title: this.buildTitle(),
        isLoading: isFetching,
        fetchProfileError,
        noProfileDataAvailable,
        shouldDisplayFlamegraph,
        shouldDisplayInfo,
        profile: profile as FlamebearerProfile,
        settings,
        fetchSettingsError,
        ai: {
          panel: aiPanel,
          fetchParams: [
            { query: baselineQuery, timeRange: baselineTimeRange },
            { query: comparisonQuery, timeRange: comparisonTimeRange },
          ],
        },
      },
      actions: {},
    };
  };

  static Component = ({ model }: SceneComponentProps<SceneDiffFlameGraph>) => {
    const styles = useStyles2(getStyles);

    const { data } = model.useSceneDiffFlameGraph();
    const sidePanel = useToggleSidePanel();

    const isAiButtonDisabled = data.isLoading || data.shouldDisplayInfo || data.noProfileDataAvailable;

    useEffect(() => {
      if (isAiButtonDisabled) {
        sidePanel.close();
      }
    }, [isAiButtonDisabled, sidePanel]);

    if (data.fetchSettingsError) {
      displayWarning([
        'Error while retrieving the plugin settings!',
        'Some features might not work as expected (e.g. flamegraph export options). Please try to reload the page, sorry for the inconvenience.',
      ]);
    }

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
          {data.shouldDisplayInfo && (
            <InlineBanner
              severity="info"
              title=""
              message="Select both the baseline and the comparison flame graph time ranges to view the diff flame graph."
            />
          )}

          {data.fetchProfileError && (
            <InlineBanner
              severity="error"
              title="Error while loading profile data!"
              errors={[data.fetchProfileError]}
            />
          )}

          {data.noProfileDataAvailable && (
            <InlineBanner
              severity="warning"
              title="No profile data available"
              message="Please verify that you've selected adequate filters and time ranges."
            />
          )}

          {data.shouldDisplayFlamegraph && (
            <FlameGraph
              diff={true}
              profile={data.profile}
              enableFlameGraphDotComExport={data.settings?.enableFlameGraphDotComExport}
              collapsedFlamegraphs={data.settings?.collapsedFlamegraphs}
            />
          )}
        </Panel>

        {sidePanel.isOpen('ai') && (
          <data.ai.panel.Component
            model={data.ai.panel}
            isDiff
            fetchParams={data.ai.fetchParams}
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
