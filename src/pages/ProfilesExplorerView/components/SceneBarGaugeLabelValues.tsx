import { DataFrame, FieldMatcherID, LoadingState, VizOrientation } from '@grafana/data';
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
import { DATA_TRANSFORMATIONS } from './SceneByVariableRepeaterGrid/SceneByVariableRepeaterGrid';

interface SceneBarGaugeLabelValuesState extends SceneObjectState {
  body: VizPanel;
}

export class SceneBarGaugeLabelValues extends SceneObjectBase<SceneBarGaugeLabelValuesState> {
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
            transformations: [
              DATA_TRANSFORMATIONS.addRefId,
              DATA_TRANSFORMATIONS.addStats,
              DATA_TRANSFORMATIONS.sortSeries,
            ],
          })
        )
        .setHeaderActions(headerActions(item))
        // options needed in case there's no data - if there's data, these options are overriden in getBarGaugePanelConfig()
        .setOption('valueMode', BarGaugeValueMode.Text)
        .setOption('orientation', VizOrientation.Horizontal)
        .setOption('showUnfilled', false)
        .setColor({ mode: 'fixed' })
        .build(),
    });

    this.addActivationHandler(this.onActivate.bind(this, item));
  }

  onActivate(item: GridItemData) {
    const { body } = this.state;

    const sub = (body.state.$data as SceneDataTransformer)!.subscribeToState((state) => {
      if (state.data?.state !== LoadingState.Done || !state.data.series.length) {
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

    const description = item.queryRunnerParams.groupBy?.label
      ? 'This panel displays aggregate values over the current time period'
      : undefined;

    return {
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
          min: 0,
          max,
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

  static Component({ model }: SceneComponentProps<SceneBarGaugeLabelValues>) {
    const { body } = model.useState();

    return <body.Component model={body} />;
  }
}
