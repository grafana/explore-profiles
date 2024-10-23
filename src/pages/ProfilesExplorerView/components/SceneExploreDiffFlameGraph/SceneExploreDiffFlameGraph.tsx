import { css } from '@emotion/css';
import { DashboardCursorSync, GrafanaTheme2 } from '@grafana/data';
import { locationService } from '@grafana/runtime';
import { behaviors, SceneComponentProps, sceneGraph, SceneObjectBase, SceneObjectState } from '@grafana/scenes';
import { useStyles2 } from '@grafana/ui';
import React from 'react';

import { ProfileMetricVariable } from '../../domain/variables/ProfileMetricVariable';
import { ServiceNameVariable } from '../../domain/variables/ServiceNameVariable/ServiceNameVariable';
import { CompareTarget } from '../SceneExploreServiceLabels/components/SceneGroupByLabels/components/SceneLabelValuesGrid/domain/types';
import { SceneComparePanel } from './components/SceneComparePanel/SceneComparePanel';
import { SceneDiffFlameGraph } from './components/SceneDiffFlameGraph/SceneDiffFlameGraph';
import { ScenePresetsPicker } from './components/ScenePresetsPicker/ScenePresetsPicker';
import { syncYAxis } from './domain/behaviours/syncYAxis';
import { EventDiffAutoSelect } from './domain/events/EventDiffAutoSelect';
import { EventDiffChoosePreset } from './domain/events/EventDiffChoosePreset';

interface SceneExploreDiffFlameGraphState extends SceneObjectState {
  baselinePanel: SceneComparePanel;
  comparisonPanel: SceneComparePanel;
  body: SceneDiffFlameGraph;
  presetsPicker: ScenePresetsPicker;
}

export class SceneExploreDiffFlameGraph extends SceneObjectBase<SceneExploreDiffFlameGraphState> {
  constructor({ useAncestorTimeRange }: { useAncestorTimeRange: boolean }) {
    super({
      key: 'explore-diff-flame-graph',
      baselinePanel: new SceneComparePanel({
        target: CompareTarget.BASELINE,
        useAncestorTimeRange,
      }),
      comparisonPanel: new SceneComparePanel({
        target: CompareTarget.COMPARISON,
        useAncestorTimeRange,
      }),
      $behaviors: [
        new behaviors.CursorSync({
          key: 'metricCrosshairSync',
          sync: DashboardCursorSync.Crosshair,
        }),
        syncYAxis(),
      ],
      body: new SceneDiffFlameGraph(),
      presetsPicker: new ScenePresetsPicker(),
    });

    this.addActivationHandler(this.onActivate.bind(this));
  }

  onActivate() {
    // hack to force UrlSyncManager to handle a new location
    // this will sync the state from the URL by calling updateFromUrl() on all the time ranges (`SceneTimeRange` and our custom `SceneTimeRangeWithAnnotations`) that are defined on `SceneComparePanel`
    // if not, landing on this view will result in empty URL search parameters (to/from and diffTo/diffFrom) which will make shareable links useless
    locationService.partial({}, true); // replace to avoid creating history items

    const profileMetricVariable = sceneGraph.findByKeyAndType(this, 'profileMetricId', ProfileMetricVariable);

    profileMetricVariable.setState({ query: ProfileMetricVariable.QUERY_SERVICE_NAME_DEPENDENT });
    profileMetricVariable.update(true);

    this.subscribeToEvents();

    return () => {
      profileMetricVariable.setState({ query: ProfileMetricVariable.QUERY_DEFAULT });
      profileMetricVariable.update(true);
    };
  }

  subscribeToEvents() {
    this._subs.add(
      this.subscribeToEvent(EventDiffAutoSelect, () => {
        this.autoSelectDiffRanges();
      })
    );

    this._subs.add(
      this.subscribeToEvent(EventDiffChoosePreset, () => {
        this.state.presetsPicker.openSelect();
      })
    );
  }

  autoSelectDiffRanges() {
    const { baselinePanel, comparisonPanel } = this.state;

    baselinePanel.autoSelectDiffRange();
    comparisonPanel.autoSelectDiffRange();
  }

  // see SceneProfilesExplorer
  getVariablesAndGridControls() {
    return {
      variables: [
        sceneGraph.findByKeyAndType(this, 'serviceName', ServiceNameVariable),
        sceneGraph.findByKeyAndType(this, 'profileMetricId', ProfileMetricVariable),
        this.state.presetsPicker,
      ],
      gridControls: [],
    };
  }

  useDiffTimeRanges = () => {
    const { baselinePanel, comparisonPanel } = this.state;

    const { annotationTimeRange: baselineTimeRange } = baselinePanel.useDiffTimeRange();
    const { annotationTimeRange: comparisonTimeRange } = comparisonPanel.useDiffTimeRange();

    return {
      baselineTimeRange,
      comparisonTimeRange,
    };
  };

  static Component({ model }: SceneComponentProps<SceneExploreDiffFlameGraph>) {
    const styles = useStyles2(getStyles); // eslint-disable-line react-hooks/rules-of-hooks

    const { baselinePanel, comparisonPanel, body } = model.useState();

    return (
      <div className={styles.container}>
        <div className={styles.columns}>
          <baselinePanel.Component model={baselinePanel} />
          <comparisonPanel.Component model={comparisonPanel} />
        </div>

        <body.Component model={body} />
      </div>
    );
  }
}

const getStyles = (theme: GrafanaTheme2) => ({
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
});
