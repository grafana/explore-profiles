import { css } from '@emotion/css';
import { GrafanaTheme2 } from '@grafana/data';
import { SceneComponentProps, sceneGraph, SceneObjectBase, SceneObjectState } from '@grafana/scenes';
import { Spinner, useStyles2 } from '@grafana/ui';
import { AiPanel } from '@shared/components/AiPanel/AiPanel';
import { AIButton } from '@shared/components/AiPanel/components/AIButton';
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
import { ProfileMetricVariable } from '../../../../domain/variables/ProfileMetricVariable';
import { ProfilesDataSourceVariable } from '../../../../domain/variables/ProfilesDataSourceVariable';
import { ServiceNameVariable } from '../../../../domain/variables/ServiceNameVariable';
import { SceneExploreDiffFlameGraph } from '../../SceneExploreDiffFlameGraph';
import { useFetchDiffProfile } from './infrastructure/useFetchDiffProfile';

interface SceneDiffFlameGraphState extends SceneObjectState {}

export class SceneDiffFlameGraph extends SceneObjectBase<SceneDiffFlameGraphState> {
  constructor() {
    super({ key: 'diff-flame-graph' });
  }

  useSceneDiffFlameGraph = (): DomainHookReturnValue => {
    const { baselineTimeRange, comparisonTimeRange } = (this.parent as SceneExploreDiffFlameGraph).useDiffTimeRanges();

    const baselineQuery = useBuildPyroscopeQuery(this, 'filtersBaseline');
    const comparisonQuery = useBuildPyroscopeQuery(this, 'filtersComparison');

    const { settings, error: fetchSettingsError } = useFetchPluginSettings();

    const dataSourceUid = sceneGraph.findByKeyAndType(this, 'dataSource', ProfilesDataSourceVariable).useState()
      .value as string;
    const serviceName = sceneGraph.findByKeyAndType(this, 'serviceName', ServiceNameVariable).useState()
      .value as string;
    const profileMetricId = sceneGraph.findByKeyAndType(this, 'profileMetricId', ProfileMetricVariable).useState()
      .value as string;
    const profileMetricType = getProfileMetric(profileMetricId as ProfileMetricId).type;

    const {
      isFetching,
      error: fetchProfileError,
      profile,
    } = useFetchDiffProfile({
      dataSourceUid,
      serviceName,
      baselineTimeRange,
      baselineQuery,
      comparisonTimeRange,
      comparisonQuery,
    });

    const noProfileDataAvailable = !isFetching && !fetchProfileError && profile?.flamebearer.numTicks === 0;
    const shouldDisplayFlamegraph = Boolean(!fetchProfileError && !noProfileDataAvailable && profile);
    const shouldDisplayInfo = !Boolean(
      baselineQuery &&
        comparisonQuery &&
        baselineTimeRange.raw.from.valueOf() &&
        baselineTimeRange.raw.to.valueOf() &&
        comparisonTimeRange.raw.from.valueOf() &&
        comparisonTimeRange.raw.to.valueOf()
    );

    return {
      data: {
        title: `${serviceName} diff flame graph (${profileMetricType})`,
        isLoading: isFetching,
        fetchProfileError,
        noProfileDataAvailable,
        shouldDisplayFlamegraph,
        shouldDisplayInfo,
        profile: profile as FlamebearerProfile,
        settings,
        fetchSettingsError,
      },
      actions: {},
    };
  };

  static Component = ({ model }: SceneComponentProps<SceneDiffFlameGraph>) => {
    const styles = useStyles2(getStyles);

    const { data } = model.useSceneDiffFlameGraph();
    const {
      isLoading,
      fetchProfileError,
      shouldDisplayInfo,
      shouldDisplayFlamegraph,
      noProfileDataAvailable,
      profile,
      fetchSettingsError,
      settings,
    } = data;

    const sidePanel = useToggleSidePanel();

    useEffect(() => {
      if (data.isLoading) {
        sidePanel.close();
      }
    }, [data.isLoading, sidePanel]);

    if (fetchSettingsError) {
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
              onClick={() => sidePanel.open('ai')}
              disabled={isLoading || noProfileDataAvailable || sidePanel.isOpen('ai')}
              interactionName="g_pyroscope_app_explain_flamegraph_clicked"
            >
              Explain Flame Graph
            </AIButton>
          }
        >
          {shouldDisplayInfo && (
            <InlineBanner
              severity="info"
              title=""
              message="Select both the baseline and the comparison flame graph time ranges to view the diff flame graph."
            />
          )}

          {fetchProfileError && (
            <InlineBanner severity="error" title="Error while loading profile data!" errors={[fetchProfileError]} />
          )}

          {noProfileDataAvailable && (
            <InlineBanner
              severity="warning"
              title="No profile data available"
              message="Please verify that you've selected adequate time ranges and filters."
            />
          )}

          {shouldDisplayFlamegraph && (
            <FlameGraph
              diff={true}
              profile={profile}
              enableFlameGraphDotComExport={settings?.enableFlameGraphDotComExport}
              collapsedFlamegraphs={settings?.collapsedFlamegraphs}
            />
          )}
        </Panel>

        {sidePanel.isOpen('ai') && <AiPanel className={styles.sidePanel} onClose={sidePanel.close} />}
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
