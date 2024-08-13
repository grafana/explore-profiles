import { css } from '@emotion/css';
import { DashboardCursorSync, GrafanaTheme2 } from '@grafana/data';
import { behaviors, SceneComponentProps, sceneGraph, SceneObjectBase, SceneObjectState } from '@grafana/scenes';
import { Spinner, useStyles2 } from '@grafana/ui';
import { AiPanel } from '@shared/components/AiPanel/AiPanel';
import { AIButton } from '@shared/components/AiPanel/components/AIButton';
import { FlameGraph } from '@shared/components/FlameGraph/FlameGraph';
import { useToggleSidePanel } from '@shared/domain/useToggleSidePanel';
import { useFetchPluginSettings } from '@shared/infrastructure/settings/useFetchPluginSettings';
import { FlamebearerProfile } from '@shared/types/FlamebearerProfile';
import React, { useEffect } from 'react';

import { useFetchDiffProfile } from '../../../../pages/ComparisonView/components/FlameGraphContainer/infrastructure/useFetchDiffProfile';
import { useDefaultComparisonParamsFromUrl } from '../../../../pages/ComparisonView/domain/useDefaultComparisonParamsFromUrl';
import { ProfileMetricVariable } from '../../domain/variables/ProfileMetricVariable';
import { ServiceNameVariable } from '../../domain/variables/ServiceNameVariable';
import { CompareTarget } from '../SceneExploreServiceLabels/components/SceneGroupByLabels/components/SceneLabelValuesGrid/domain/types';
import { SceneComparePanel } from './components/SceneComparePanel/SceneComparePanel';

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

  static Component({ model }: SceneComponentProps<SceneExploreDiffFlameGraphs>) {
    const styles = useStyles2(getStyles); // eslint-disable-line react-hooks/rules-of-hooks

    const { baselinePanel, comparisonPanel } = model.useState();

    useDefaultComparisonParamsFromUrl(); // eslint-disable-line react-hooks/rules-of-hooks
    const { isFetching, error, profile } = useFetchDiffProfile({}); // eslint-disable-line react-hooks/rules-of-hooks
    const noProfileDataAvailable = !error && profile?.flamebearer.numTicks === 0;
    const shouldDisplayFlamegraph = Boolean(!error && !noProfileDataAvailable && profile);

    const { settings /*, error: isFetchingSettingsError*/ } = useFetchPluginSettings(); // eslint-disable-line react-hooks/rules-of-hooks

    const sidePanel = useToggleSidePanel(); // eslint-disable-line react-hooks/rules-of-hooks

    // eslint-disable-next-line react-hooks/rules-of-hooks
    useEffect(() => {
      if (isFetching) {
        sidePanel.close();
      }
    }, [isFetching, sidePanel]);

    // console.log('*** Component', left, right, isFetching, error, profile);

    return (
      <div className={styles.container}>
        <div className={styles.columns}>
          <baselinePanel.Component model={baselinePanel} />
          <comparisonPanel.Component model={comparisonPanel} />
        </div>

        <div className={styles.flex}>
          <div className={styles.flameGraphPanel}>
            {isFetching && <Spinner inline />}

            {shouldDisplayFlamegraph && (
              <>
                <div className={styles.flameGraphHeaderActions}>
                  <AIButton
                    onClick={() => {
                      sidePanel.open('ai');
                    }}
                    disabled={isFetching || noProfileDataAvailable || sidePanel.isOpen('ai')}
                    interactionName="g_pyroscope_app_explain_flamegraph_clicked"
                  >
                    Explain Flame Graph
                  </AIButton>
                </div>

                <FlameGraph
                  diff={true}
                  profile={profile as FlamebearerProfile}
                  enableFlameGraphDotComExport={settings?.enableFlameGraphDotComExport}
                  collapsedFlamegraphs={settings?.collapsedFlamegraphs}
                />
              </>
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
    align-items: flex-end;

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
