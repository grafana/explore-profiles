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

import { buildTimeSeriesQueryRunner } from '../data/timeseries/buildTimeSeriesQueryRunner';
import { getColorByIndex } from '../helpers/getColorByIndex';
import { GridItemData } from './SceneByVariableRepeaterGrid/GridItemData';
import { addRefId, addStats, sortSeries } from './SceneByVariableRepeaterGrid/infrastructure/data-transformations';

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
            transformations: [addRefId, addStats, sortSeries],
          })
        )
        .setHeaderActions(headerActions(item))
        .build(),
    });

    this.addActivationHandler(this.onActivate.bind(this, item));
  }

  onActivate(item: GridItemData) {
    const { body } = this.state;

    const sub = (body.state.$data as SceneDataTransformer)!.subscribeToState((state) => {
      if (state.data?.state !== LoadingState.Done) {
        return;
      }

      body.setState(this.getConfig(item, state.data.series));
    });

    return () => {
      sub.unsubscribe();
    };
  }

  getConfig(item: GridItemData, series: DataFrame[]) {
    let max = Number.NEGATIVE_INFINITY;

    for (const serie of series) {
      const allValuesSum = serie.meta?.stats?.find(({ displayName }) => displayName === 'allValuesSum')?.value || 0;

      if (allValuesSum > max) {
        max = allValuesSum;
      }
    }

    const groupByLabel = item.queryRunnerParams.groupBy?.label;

    const description = groupByLabel ? 'This panel displays aggregate values over the current time period' : undefined;

    return {
      title: `${item.label} (${series.length})`,
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
        // namePlacement: BarGaugeNamePlacement.Left,
        // minVizHeight: 20,
        // maxVizHeight: 20,
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
    const groupByLabel = item.queryRunnerParams.groupBy?.label;

    return series.map((serie, i) => ({
      matcher: { id: FieldMatcherID.byFrameRefID, options: serie.refId },
      properties: [
        {
          id: 'displayName',
          value: groupByLabel ? serie.fields[1].labels?.[groupByLabel] : serie.fields[1].name,
        },
        {
          id: 'color',
          value: { mode: 'fixed', fixedColor: getColorByIndex(item.index + i) },
        },
      ],
    }));
  }

  static Component({ model }: SceneComponentProps<SceneLabelValuesBarGauge>) {
    const { body } = model.useState();

    return <body.Component model={body} />;
  }
}