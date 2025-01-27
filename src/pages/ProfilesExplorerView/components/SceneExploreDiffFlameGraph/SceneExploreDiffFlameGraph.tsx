import { css } from '@emotion/css';
import { AdHocVariableFilter, DashboardCursorSync, GrafanaTheme2, TimeRange } from '@grafana/data';
import { locationService } from '@grafana/runtime';
import {
  behaviors,
  SceneComponentProps,
  sceneGraph,
  SceneObjectBase,
  SceneObjectState,
  SceneTimeRangeState,
} from '@grafana/scenes';
import { useStyles2 } from '@grafana/ui';
import React from 'react';

import { ProfileMetricVariable } from '../../domain/variables/ProfileMetricVariable';
import { ServiceNameVariable } from '../../domain/variables/ServiceNameVariable/ServiceNameVariable';
import { EventEnableSyncTimeRanges } from './components/SceneComparePanel/domain/events/EventEnableSyncTimeRanges';
import { EventSyncRefresh } from './components/SceneComparePanel/domain/events/EventSyncRefresh';
import { EventSyncTimeRanges } from './components/SceneComparePanel/domain/events/EventSyncTimeRanges';
import { SceneComparePanel } from './components/SceneComparePanel/SceneComparePanel';
import { SceneDiffFlameGraph } from './components/SceneDiffFlameGraph/SceneDiffFlameGraph';
import { ScenePresetsPicker } from './components/ScenePresetsPicker/ScenePresetsPicker';
import { syncYAxis } from './domain/behaviours/syncYAxis';
import { EventDiffAutoSelect } from './domain/events/EventDiffAutoSelect';
import { EventDiffChoosePreset } from './domain/events/EventDiffChoosePreset';
import { CompareTarget } from './domain/types';

interface SceneExploreDiffFlameGraphState extends SceneObjectState {
  baselinePanel: SceneComparePanel;
  comparisonPanel: SceneComparePanel;
  body: SceneDiffFlameGraph;
  presetsPicker: ScenePresetsPicker;
}

export class SceneExploreDiffFlameGraph extends SceneObjectBase<SceneExploreDiffFlameGraphState> {
  constructor({
    useAncestorTimeRange,
    clearDiffRange,
    baselineFilters,
    comparisonFilters,
  }: {
    useAncestorTimeRange?: boolean;
    clearDiffRange?: boolean;
    baselineFilters?: AdHocVariableFilter[];
    comparisonFilters?: AdHocVariableFilter[];
  }) {
    super({
      key: 'explore-diff-flame-graph',
      baselinePanel: new SceneComparePanel({
        target: CompareTarget.BASELINE,
        useAncestorTimeRange: Boolean(useAncestorTimeRange),
        clearDiffRange: Boolean(clearDiffRange),
        filters: baselineFilters || [],
      }),
      comparisonPanel: new SceneComparePanel({
        target: CompareTarget.COMPARISON,
        useAncestorTimeRange: Boolean(useAncestorTimeRange),
        clearDiffRange: Boolean(clearDiffRange),
        filters: comparisonFilters || [],
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
      this.subscribeToEvent(EventDiffAutoSelect, (event) => {
        const selectWholeRange = event.payload.wholeRange;
        const { baselinePanel, comparisonPanel } = this.state;

        baselinePanel.toggleTimeRangeSync(false);
        comparisonPanel.toggleTimeRangeSync(false);

        baselinePanel.autoSelectDiffRange(selectWholeRange);
        comparisonPanel.autoSelectDiffRange(selectWholeRange);
      })
    );

    this._subs.add(
      this.subscribeToEvent(EventDiffChoosePreset, () => {
        this.state.presetsPicker.openSelect();
      })
    );

    this._subs.add(
      this.subscribeToEvent(EventEnableSyncTimeRanges, (event) => {
        const { source, enable, timeRange, annotationTimeRange } = event.payload;
        const { baselinePanel, comparisonPanel } = this.state;
        const targetPanel = source === CompareTarget.BASELINE ? comparisonPanel : baselinePanel;

        if (enable) {
          this.syncTimeRanges(targetPanel, timeRange, annotationTimeRange);
        }

        comparisonPanel.toggleTimeRangeSync(enable);
        baselinePanel.toggleTimeRangeSync(enable);
      })
    );

    this._subs.add(
      this.subscribeToEvent(EventSyncTimeRanges, (event) => {
        const { source, timeRange, annotationTimeRange } = event.payload;
        const { baselinePanel, comparisonPanel } = this.state;
        const targetPanel = source === CompareTarget.BASELINE ? comparisonPanel : baselinePanel;

        this.syncTimeRanges(targetPanel, timeRange, annotationTimeRange);
      })
    );

    this._subs.add(
      this.subscribeToEvent(EventSyncRefresh, (event) => {
        const { source } = event.payload;
        const { baselinePanel, comparisonPanel } = this.state;
        const targetPanel = source === CompareTarget.BASELINE ? comparisonPanel : baselinePanel;

        targetPanel.refreshTimeseries();
      })
    );
  }

  syncTimeRanges(targetPanel: SceneComparePanel, timeRange?: SceneTimeRangeState, annotationTimeRange?: TimeRange) {
    if (timeRange) {
      targetPanel.setTimeRange(timeRange);
    }

    if (annotationTimeRange) {
      targetPanel.setDiffRange({
        from: annotationTimeRange.from.toISOString(),
        to: annotationTimeRange.to.toISOString(),
      });
    }
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
