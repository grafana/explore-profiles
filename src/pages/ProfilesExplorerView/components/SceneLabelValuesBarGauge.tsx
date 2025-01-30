import { DataFrame, FieldMatcherID, LoadingState, ThresholdsMode, VizOrientation } from '@grafana/data';
import {
  PanelBuilders,
  SceneComponentProps,
  SceneDataTransformer,
  SceneObjectBase,
  SceneObjectState,
  VizPanel,
  VizPanelState,
} from '@grafana/scenes';
import { BarGaugeDisplayMode, BarGaugeNamePlacement, BarGaugeSizing, BarGaugeValueMode } from '@grafana/schema';
import React from 'react';

import { EventTimeseriesDataReceived } from '../domain/events/EventTimeseriesDataReceived';
import { getColorByIndex } from '../helpers/getColorByIndex';
import { getSeriesLabelFieldName } from '../infrastructure/helpers/getSeriesLabelFieldName';
import { getSeriesStatsValue } from '../infrastructure/helpers/getSeriesStatsValue';
import { buildTimeSeriesQueryRunner } from '../infrastructure/timeseries/buildTimeSeriesQueryRunner';
import { addRefId, addStats } from './SceneByVariableRepeaterGrid/infrastructure/data-transformations';
import { GridItemData } from './SceneByVariableRepeaterGrid/types/GridItemData';

interface SceneLabelValuesBarGaugeState extends SceneObjectState {
  body: VizPanel;
}

export class SceneLabelValuesBarGauge extends SceneObjectBase<SceneLabelValuesBarGaugeState> {
  constructor({
    item,
    headerActions,
  }: {
    item: GridItemData;
    headerActions: (item: GridItemData) => VizPanelState['headerActions'];
  }) {
    super({
      key: 'bar-gauge-label-values',
      body: PanelBuilders.bargauge()
        .setTitle(item.label)
        .setData(
          new SceneDataTransformer({
            $data: buildTimeSeriesQueryRunner(item.queryRunnerParams),
            transformations: [addRefId, addStats],
          })
        )
        .setHeaderActions(headerActions(item))
        .build(),
    });

    this.addActivationHandler(this.onActivate.bind(this, item));
  }

  onActivate(item: GridItemData) {
    const { body } = this.state;

    const sub = (body.state.$data as SceneDataTransformer)!.subscribeToState((newState) => {
      if (newState.data?.state !== LoadingState.Done) {
        return;
      }

      const { series } = newState.data;

      if (series?.length) {
        body.setState(this.getConfig(item, series));
      }

      // we publish the event only after setting the new config so that the subscribers can modify it
      this.publishEvent(new EventTimeseriesDataReceived({ series }), true);
    });

    return () => {
      sub.unsubscribe();
    };
  }

  getConfig(item: GridItemData, series: DataFrame[]) {
    let max = Number.NEGATIVE_INFINITY;

    for (const s of series) {
      const allValuesSum = getSeriesStatsValue(s, 'allValuesSum') || 0;

      if (allValuesSum > max) {
        max = allValuesSum;
      }
    }

    const groupByLabel = item.queryRunnerParams.groupBy?.label;

    const description = groupByLabel ? 'This panel displays aggregate values over the current time period' : undefined;

    return {
      title: series.length > 1 ? `${item.label} (${series.length})` : item.label,
      description,
      options: {
        reduceOptions: { values: false, calcs: ['sum'] },
        orientation: VizOrientation.Horizontal,
        displayMode: BarGaugeDisplayMode.Gradient,
        valueMode: BarGaugeValueMode.Text,
        showUnfilled: true,
        sizing: BarGaugeSizing.Manual,
        text: { titleSize: 13, valueSize: 13 },
        namePlacement: BarGaugeNamePlacement.Top,
        minVizHeight: 36,
        maxVizHeight: 36,
        legend: {
          showLegend: false,
        },
      },
      fieldConfig: {
        defaults: {
          // we force the label value because the overrides don't seem to work when we receive a single serie
          displayName: series.length === 1 ? groupByLabel : undefined,
          min: 0,
          max,
          thresholds: {
            mode: ThresholdsMode.Percentage,
            steps: [],
          },
        },
        overrides: this.getOverrides(item, series),
      },
    };
  }

  getOverrides(item: GridItemData, series: DataFrame[]) {
    const { index: startColorIndex, queryRunnerParams } = item;
    const groupByLabel = queryRunnerParams.groupBy?.label;

    return series.map((s, i) => ({
      matcher: { id: FieldMatcherID.byFrameRefID, options: s.refId },
      properties: [
        {
          id: 'displayName',
          value: getSeriesLabelFieldName(s.fields[1], groupByLabel),
        },
        {
          id: 'color',
          value: { mode: 'fixed', fixedColor: getColorByIndex(startColorIndex + i) },
        },
      ],
    }));
  }

  static Component({ model }: SceneComponentProps<SceneLabelValuesBarGauge>) {
    const { body } = model.useState();

    return <body.Component model={body} />;
  }
}
