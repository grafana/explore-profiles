import { css } from '@emotion/css';
import { DashboardCursorSync, GrafanaTheme2 } from '@grafana/data';
import { behaviors, SceneComponentProps, sceneGraph, SceneObjectBase, SceneObjectState } from '@grafana/scenes';
import { Spinner, useStyles2 } from '@grafana/ui';
import { AiPanel } from '@shared/components/AiPanel/AiPanel';
import { AIButton } from '@shared/components/AiPanel/components/AIButton';
import { FlameGraph } from '@shared/components/FlameGraph/FlameGraph';
import { displayWarning } from '@shared/domain/displayStatus';
import { useToggleSidePanel } from '@shared/domain/useToggleSidePanel';
import { useFetchPluginSettings } from '@shared/infrastructure/settings/useFetchPluginSettings';
import { FlamebearerProfile } from '@shared/types/FlamebearerProfile';
import { InlineBanner } from '@shared/ui/InlineBanner';
import React, { useEffect } from 'react';

import { useBuildPyroscopeQuery } from '../../domain/useBuildPyroscopeQuery';
import { ProfileMetricVariable } from '../../domain/variables/ProfileMetricVariable';
import { ProfilesDataSourceVariable } from '../../domain/variables/ProfilesDataSourceVariable';
import { ServiceNameVariable } from '../../domain/variables/ServiceNameVariable';
import { CompareTarget } from '../SceneExploreServiceLabels/components/SceneGroupByLabels/components/SceneLabelValuesGrid/domain/types';
import { SceneComparePanel } from './components/SceneComparePanel/SceneComparePanel';
import { syncYAxis } from './domain/behaviours/syncYAxis';
import { useFetchDiffProfile } from './infrastructure/useFetchDiffProfile';

interface SceneExploreDiffFlameGraphState extends SceneObjectState {
  baselinePanel: SceneComparePanel;
  comparisonPanel: SceneComparePanel;
}

export class SceneExploreDiffFlameGraph extends SceneObjectBase<SceneExploreDiffFlameGraphState> {
  constructor({ useAncestorTimeRange }: { useAncestorTimeRange: boolean }) {
    const baselinePanel = new SceneComparePanel({
      target: CompareTarget.BASELINE,
      useAncestorTimeRange,
    });

    const comparisonPanel = new SceneComparePanel({
      target: CompareTarget.COMPARISON,
      useAncestorTimeRange,
    });

    super({
      key: 'explore-diff-flame-graph',
      baselinePanel,
      comparisonPanel,
      $behaviors: [
        new behaviors.CursorSync({
          key: 'metricCrosshairSync',
          sync: DashboardCursorSync.Crosshair,
        }),
        syncYAxis(),
      ],
    });

    this.addActivationHandler(this.onActivate.bind(this));
  }

  onActivate() {
    const profileMetricVariable = sceneGraph.findByKeyAndType(this, 'profileMetricId', ProfileMetricVariable);

    profileMetricVariable.setState({ query: ProfileMetricVariable.QUERY_SERVICE_NAME_DEPENDENT });
    profileMetricVariable.update(true);

    return () => {
      profileMetricVariable.setState({ query: ProfileMetricVariable.QUERY_DEFAULT });
      profileMetricVariable.update(true);
    };
  }

  // see SceneProfilesExplorer
  getVariablesAndGridControls() {
    return {
      variables: [
        sceneGraph.findByKeyAndType(this, 'serviceName', ServiceNameVariable),
        sceneGraph.findByKeyAndType(this, 'profileMetricId', ProfileMetricVariable),
      ],
      gridControls: [],
    };
  }

  useSceneExploreDiffFlameGraph = () => {
    const { baselinePanel, comparisonPanel } = this.useState();

    const { annotationTimeRange: baselineTimeRange } = baselinePanel.useDiffTimeRange();
    const baselineQuery = useBuildPyroscopeQuery(this, 'filtersBaseline');

    const { annotationTimeRange: comparisonTimeRange } = comparisonPanel.useDiffTimeRange();
    const comparisonQuery = useBuildPyroscopeQuery(this, 'filtersComparison');

    const { settings, error: fetchSettingsError } = useFetchPluginSettings();

    const dataSourceUid = sceneGraph.findByKeyAndType(this, 'dataSource', ProfilesDataSourceVariable).useState()
      .value as string;
    const serviceName = sceneGraph.findByKeyAndType(this, 'serviceName', ServiceNameVariable).useState()
      .value as string;

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
        baselinePanel,
        comparisonPanel,
        isLoading: isFetching,
        fetchProfileError,
        noProfileDataAvailable,
        shouldDisplayFlamegraph,
        shouldDisplayInfo,
        profile,
        settings,
        fetchSettingsError,
      },
      actions: {},
    };
  };

  /* eslint-disable react-hooks/rules-of-hooks */
  static Component({ model }: SceneComponentProps<SceneExploreDiffFlameGraph>) {
    const styles = useStyles2(getStyles);

    const { data } = model.useSceneExploreDiffFlameGraph();
    const {
      baselinePanel,
      comparisonPanel,
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
      if (isLoading) {
        sidePanel.close();
      }
    }, [isLoading, sidePanel]);

    if (fetchSettingsError) {
      displayWarning([
        'Error while retrieving the plugin settings!',
        'Some features might not work as expected (e.g. flamegraph export options). Please try to reload the page, sorry for the inconvenience.',
      ]);
    }

    return (
      <div className={styles.container}>
        <div className={styles.columns}>
          <baselinePanel.Component model={baselinePanel} />
          <comparisonPanel.Component model={comparisonPanel} />
        </div>

        <div className={styles.flex}>
          <div className={styles.flameGraphPanel}>
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

            <div className={styles.flameGraphHeaderActions}>
              {isLoading && <Spinner inline />}

              {shouldDisplayFlamegraph && (
                <AIButton
                  onClick={() => {
                    sidePanel.open('ai');
                  }}
                  disabled={isLoading || noProfileDataAvailable || sidePanel.isOpen('ai')}
                  interactionName="g_pyroscope_app_explain_flamegraph_clicked"
                >
                  Explain Flame Graph
                </AIButton>
              )}
            </div>

            {shouldDisplayFlamegraph && (
              <FlameGraph
                diff={true}
                profile={profile as FlamebearerProfile}
                enableFlameGraphDotComExport={settings?.enableFlameGraphDotComExport}
                collapsedFlamegraphs={settings?.collapsedFlamegraphs}
              />
            )}
          </div>

          {sidePanel.isOpen('ai') && <AiPanel className={styles.sidePanel} onClose={sidePanel.close} />}
        </div>
      </div>
    );
  }
}

const getStyles = (theme: GrafanaTheme2) => ({
  flex: css`
    display: flex;
  `,
  container: css`
    width: 100%;
    display: flex;
    flex-direction: column;
  `,
  columns: css`
    display: flex;
    flex-direction: row;
    gap: ${theme.spacing(1)};
    margin-bottom: ${theme.spacing(1)};

    & > div {
      flex: 1 1 0;
    }
  `,
  flameGraphPanel: css`
    min-width: 0;
    flex-grow: 1;
    width: 100%;
    padding: ${theme.spacing(1)};
    border: 1px solid ${theme.colors.border.weak};
    border-radius: 2px;

    & [role='status'],
    & [role='alert'] {
      margin-bottom: 0;
    }
  `,
  flameGraphHeaderActions: css`
    display: flex;
    align-items: flex-start;

    & > button {
      margin-left: auto;
    }
  `,
  sidePanel: css`
    flex: 1 0 50%;
    margin-left: 8px;
    max-width: calc(50% - 4px);
  `,
});
