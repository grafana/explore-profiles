import { AdHocVariableFilter, DashboardCursorSync } from '@grafana/data';
import { locationService } from '@grafana/runtime';
import {
  behaviors,
  SceneComponentProps,
  SceneFlexItem,
  SceneFlexLayout,
  sceneGraph,
  SceneObjectBase,
  SceneObjectState,
} from '@grafana/scenes';
import React from 'react';

import { ProfileMetricVariable } from '../../domain/variables/ProfileMetricVariable';
import { ServiceNameVariable } from '../../domain/variables/ServiceNameVariable/ServiceNameVariable';
import { EventSyncRefresh } from './components/SceneComparePanel/domain/events/EventSyncRefresh';
import { EventSyncTimeRanges } from './components/SceneComparePanel/domain/events/EventSyncTimeRanges';
import { SceneComparePanel } from './components/SceneComparePanel/SceneComparePanel';
import { SceneDiffFlameGraph } from './components/SceneDiffFlameGraph/SceneDiffFlameGraph';
import { ScenePresetsPicker } from './components/ScenePresetsPicker/ScenePresetsPicker';
import { syncYAxis } from './domain/behaviours/syncYAxis';
import { EventDiffAutoSelect } from './domain/events/EventDiffAutoSelect';
import { CompareTarget } from './domain/types';

interface SceneExploreDiffFlameGraphState extends SceneObjectState {
  body: SceneFlexLayout;
  presetsPicker: ScenePresetsPicker;
}

export class SceneExploreDiffFlameGraph extends SceneObjectBase<SceneExploreDiffFlameGraphState> {
  constructor({
    baselineFilters,
    comparisonFilters,
  }: {
    baselineFilters?: AdHocVariableFilter[];
    comparisonFilters?: AdHocVariableFilter[];
  }) {
    const baselinePanel = new SceneComparePanel({
      target: CompareTarget.BASELINE,
      clearDiffRange: true,
      filters: baselineFilters || [],
    });

    const comparisonPanel = new SceneComparePanel({
      target: CompareTarget.COMPARISON,
      clearDiffRange: true,
      filters: comparisonFilters || [],
    });

    super({
      key: 'explore-diff-flame-graph',
      $behaviors: [
        new behaviors.CursorSync({
          key: 'metricCrosshairSync',
          sync: DashboardCursorSync.Crosshair,
        }),
        syncYAxis(),
      ],
      body: new SceneFlexLayout({
        direction: 'column',
        children: [
          new SceneFlexLayout({
            direction: 'row',
            children: [
              // Baseline
              new SceneFlexItem({
                body: baselinePanel,
              }),

              // Comparison
              new SceneFlexItem({
                body: comparisonPanel,
              }),
            ],
          }),

          new SceneDiffFlameGraph(),
        ],
      }),
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
        const { wholeRange } = event.payload;
        sceneGraph.findByKeyAndType(this, 'baseline-panel', SceneComparePanel).autoSelectDiffRange(wholeRange);
        sceneGraph.findByKeyAndType(this, 'comparison-panel', SceneComparePanel).autoSelectDiffRange(wholeRange);
      })
    );

    this._subs.add(
      this.subscribeToEvent(EventSyncRefresh, (event) => {
        const { source } = event.payload;
        const targetPanel = sceneGraph.findByKeyAndType(
          this,
          source === CompareTarget.BASELINE ? 'comparison-panel' : 'baseline-panel',
          SceneComparePanel
        );
        targetPanel.refreshTimeseries();
      })
    );

    this._subs.add(
      this.subscribeToEvent(EventSyncTimeRanges, (event) => {
        const { source, timeRange } = event.payload;
        if (!timeRange) {
          return;
        }

        const panelToChange = sceneGraph.findByKeyAndType(
          this,
          source === CompareTarget.BASELINE ? 'comparison-panel' : 'baseline-panel',
          SceneComparePanel
        );
        panelToChange.setTimeRange(timeRange);
      })
    );
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
    const { annotationTimeRange: baselineTimeRange } = sceneGraph
      .findByKeyAndType(this, 'baseline-panel', SceneComparePanel)
      .useDiffTimeRange();
    const { annotationTimeRange: comparisonTimeRange } = sceneGraph
      .findByKeyAndType(this, 'comparison-panel', SceneComparePanel)
      .useDiffTimeRange();

    return {
      baselineTimeRange,
      comparisonTimeRange,
    };
  };

  static Component({ model }: SceneComponentProps<SceneExploreDiffFlameGraph>) {
    const { body } = model.useState();

    return <body.Component model={body} />;
  }
}
