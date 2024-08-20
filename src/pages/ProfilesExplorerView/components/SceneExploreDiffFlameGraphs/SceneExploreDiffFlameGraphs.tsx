import { css } from '@emotion/css';
import { DashboardCursorSync, DataFrame, GrafanaTheme2, TimeRange } from '@grafana/data';
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
import { cloneDeep, merge } from 'lodash';
import React, { useEffect } from 'react';

import { EventDataReceived } from '../../domain/events/EventDataReceived';
import { useBuildPyroscopeQuery } from '../../domain/useBuildPyroscopeQuery';
import { ProfileMetricVariable } from '../../domain/variables/ProfileMetricVariable';
import { ServiceNameVariable } from '../../domain/variables/ServiceNameVariable';
import { CompareTarget } from '../SceneExploreServiceLabels/components/SceneGroupByLabels/components/SceneLabelValuesGrid/domain/types';
import { EventAnnotationTimeRangeChanged } from './components/SceneComparePanel/domain/events/EventAnnotationTimeRangeChanged';
import { SceneComparePanel } from './components/SceneComparePanel/SceneComparePanel';
import { useFetchDiffProfile } from './infrastructure/useFetchDiffProfile';

interface SceneExploreDiffFlameGraphsState extends SceneObjectState {
  baselinePanel: SceneComparePanel;
  comparisonPanel: SceneComparePanel;
}

export class SceneExploreDiffFlameGraphs extends SceneObjectBase<SceneExploreDiffFlameGraphsState> {
  constructor() {
    super({
      key: 'explore-diff-flame-graphs',
      baselinePanel: new SceneComparePanel({
        target: CompareTarget.BASELINE,
      }),
      comparisonPanel: new SceneComparePanel({
        target: CompareTarget.COMPARISON,
      }),
      $behaviors: [
        new behaviors.CursorSync({
          key: 'metricCrosshairSync',
          sync: DashboardCursorSync.Crosshair,
        }),
      ],
    });

    this.addActivationHandler(this.onActivate.bind(this));
  }

  onActivate() {
    const profileMetricVariable = sceneGraph.findByKeyAndType(this, 'profileMetricId', ProfileMetricVariable);

    profileMetricVariable.setState({ query: ProfileMetricVariable.QUERY_SERVICE_NAME_DEPENDENT });
    profileMetricVariable.update(true);

    this.subscribeToEvents();

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

  subscribeToEvents() {
    // we use the EventAnnotationTimeRangeChanged event and forcing a re-render instead of just calling React hooks
    // in useSceneExploreDiffFlameGraphs() below (see getDiffTimeRange())
    // because the timeseries are not directly built (see SceneComparePanel) and the values of the annotation time ranges
    // are not determined directly neither (see SceneTimeRangeWithAnnotations) so we would have conditional hooks calls, which is not allowed
    // TODO: we really need a native Scenes diff flame graph panel
    this._subs.add(
      this.subscribeToEvent(EventAnnotationTimeRangeChanged, () => {
        this.forceRender();
      })
    );

    const { baselinePanel, comparisonPanel } = this.state;

    function findYMax(series: DataFrame[]) {
      let yMax = -1;

      for (const value of series[0].fields[1].values) {
        if (value > yMax) {
          yMax = value;
        }
      }

      return yMax;
    }

    let lastMax = -1;

    function updateYMax() {
      const max = Math.max(yBaselineMax, yComparisonMax);

      if (max === lastMax) {
        return;
      }

      [baselinePanel, comparisonPanel].forEach((panel) => {
        const timeseries = panel.state.timeseriesPanel!.state.body;
        const { state: prevState } = timeseries;

        timeseries.clearFieldConfigCache();

        timeseries.setState({
          fieldConfig: merge(cloneDeep(prevState.fieldConfig), { defaults: { max } }),
        });
      });
    }

    let yBaselineMax = -1;
    this._subs.add(
      baselinePanel.subscribeToEvent(EventDataReceived, (event) => {
        yBaselineMax = -1;
        yBaselineMax = findYMax(event.payload.series);
        updateYMax();
      })
    );

    let yComparisonMax = -1;
    this._subs.add(
      comparisonPanel.subscribeToEvent(EventDataReceived, (event) => {
        yComparisonMax = -1;
        yComparisonMax = findYMax(event.payload.series);
        updateYMax();
      })
    );
  }

  useSceneExploreDiffFlameGraphs = () => {
    const { baselinePanel, comparisonPanel } = this.useState();

    const baselineTimeRange = baselinePanel.getDiffTimeRange()?.state.annotationTimeRange as TimeRange;
    const baselineQuery = useBuildPyroscopeQuery(this, 'filtersBaseline');

    const comparisonTimeRange = comparisonPanel.getDiffTimeRange()?.state.annotationTimeRange as TimeRange;
    const comparisonQuery = useBuildPyroscopeQuery(this, 'filtersComparison');

    const {
      isFetching,
      error: fetchProfileError,
      profile,
    } = useFetchDiffProfile({
      baselineTimeRange,
      baselineQuery,
      comparisonTimeRange,
      comparisonQuery,
    });

    const noProfileDataAvailable = !fetchProfileError && (!profile || profile?.flamebearer.numTicks === 0);
    const shouldDisplayFlamegraph = Boolean(!fetchProfileError && !noProfileDataAvailable && profile);

    const { settings, error: fetchSettingsError } = useFetchPluginSettings();

    return {
      data: {
        baselinePanel,
        comparisonPanel,
        isLoading: isFetching,
        fetchProfileError,
        noProfileDataAvailable,
        shouldDisplayFlamegraph,
        profile,
        settings,
        fetchSettingsError,
      },
      actions: {},
    };
  };

  static Component({ model }: SceneComponentProps<SceneExploreDiffFlameGraphs>) {
    const styles = useStyles2(getStyles); // eslint-disable-line react-hooks/rules-of-hooks

    const { data } = model.useSceneExploreDiffFlameGraphs();
    const {
      baselinePanel,
      comparisonPanel,
      isLoading,
      fetchProfileError,
      noProfileDataAvailable,
      shouldDisplayFlamegraph,
      profile,
      fetchSettingsError,
      settings,
    } = data;

    const sidePanel = useToggleSidePanel(); // eslint-disable-line react-hooks/rules-of-hooks

    // eslint-disable-next-line react-hooks/rules-of-hooks
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
