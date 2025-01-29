import { DataFrame, FieldMatcherID, LoadingState } from '@grafana/data';
import {
  PanelBuilders,
  SceneComponentProps,
  SceneDataTransformer,
  SceneObjectBase,
  SceneObjectState,
  VizPanel,
  VizPanelState,
} from '@grafana/scenes';
import { SortOrder } from '@grafana/schema';
import { LegendDisplayMode, TooltipDisplayMode, VizLegendOptions } from '@grafana/ui';
import React from 'react';

import { EventTimeseriesDataReceived } from '../domain/events/EventTimeseriesDataReceived';
import { formatSingleSeriesDisplayName } from '../helpers/formatSingleSeriesDisplayName';
import { getColorByIndex } from '../helpers/getColorByIndex';
import { getSeriesLabelFieldName } from '../infrastructure/helpers/getSeriesLabelFieldName';
import { buildTimeSeriesQueryRunner } from '../infrastructure/timeseries/buildTimeSeriesQueryRunner';
import { addRefId, addStats } from './SceneByVariableRepeaterGrid/infrastructure/data-transformations';
import { GridItemData } from './SceneByVariableRepeaterGrid/types/GridItemData';

interface SceneLabelValuesHistogramState extends SceneObjectState {
  body: VizPanel;
  legendPlacement: VizLegendOptions['placement'];
}

export class SceneLabelValuesHistogram extends SceneObjectBase<SceneLabelValuesHistogramState> {
  constructor({
    item,
    headerActions,
    legendPlacement,
  }: {
    item: GridItemData;
    headerActions: (item: GridItemData) => VizPanelState['headerActions'];
    legendPlacement?: SceneLabelValuesHistogramState['legendPlacement'];
  }) {
    super({
      key: 'histogram-label-values',
      legendPlacement: legendPlacement || 'bottom',
      body: PanelBuilders.histogram()
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
    const { legendPlacement } = this.state;
    const groupByLabel = item.queryRunnerParams.groupBy?.label;

    return {
      title: series.length > 1 ? `${item.label} (${series.length})` : item.label,
      options: {
        tooltip: {
          mode: TooltipDisplayMode.Single,
          sort: SortOrder.None,
        },
        legend: {
          showLegend: true,
          displayMode: LegendDisplayMode.List,
          placement: legendPlacement,
          calcs: [],
        },
      },
      fieldConfig: {
        defaults: {
          // we force the label value because the overrides don't seem to work when we receive a single serie
          displayName: series.length === 1 ? groupByLabel : undefined,
          custom: {
            lineWidth: 1,
          },
        },
        overrides: this.getOverrides(item, series),
      },
    };
  }

  getOverrides(item: GridItemData, series: DataFrame[]) {
    const { index: startColorIndex, queryRunnerParams } = item;
    const groupByLabel = queryRunnerParams.groupBy?.label;

    return series.map((s, i) => {
      const metricField = s.fields[1];
      let displayName = groupByLabel ? getSeriesLabelFieldName(metricField, groupByLabel) : metricField.name;

      if (series.length === 1) {
        displayName = formatSingleSeriesDisplayName(displayName, s);
      }

      return {
        matcher: { id: FieldMatcherID.byFrameRefID, options: s.refId },
        properties: [
          {
            id: 'displayName',
            value: displayName,
          },
          {
            id: 'color',
            value: { mode: 'fixed', fixedColor: getColorByIndex(startColorIndex + i) },
          },
        ],
      };
    });
  }

  static Component({ model }: SceneComponentProps<SceneLabelValuesHistogram>) {
    const { body } = model.useState();

    return <body.Component model={body} />;
  }
}
