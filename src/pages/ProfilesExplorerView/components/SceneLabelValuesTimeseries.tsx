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
import { GraphGradientMode } from '@grafana/schema';
import React from 'react';

import { LabelsDataSource } from '../data/labels/LabelsDataSource';
import { buildTimeSeriesQueryRunner } from '../data/timeseries/buildTimeSeriesQueryRunner';
import { getColorByIndex } from '../helpers/getColorByIndex';
import { GridItemData } from './SceneByVariableRepeaterGrid/GridItemData';
import {
  addRefId,
  addStats,
  limitNumberOfSeries,
  sortSeries,
} from './SceneByVariableRepeaterGrid/infrastructure/data-transformations';

interface SceneLabelValuesTimeseriesState extends SceneObjectState {
  body: VizPanel;
}

export class SceneLabelValuesTimeseries extends SceneObjectBase<SceneLabelValuesTimeseriesState> {
  constructor({
    item,
    headerActions,
    displayAllValues,
  }: {
    item: GridItemData;
    headerActions: (item: GridItemData) => VizPanelState['headerActions'];
    displayAllValues?: boolean;
  }) {
    const data = displayAllValues
      ? buildTimeSeriesQueryRunner(item.queryRunnerParams)
      : new SceneDataTransformer({
          $data: buildTimeSeriesQueryRunner(item.queryRunnerParams),
          transformations: [addRefId, addStats, sortSeries, limitNumberOfSeries],
        });

    super({
      key: 'bar-timeseries-label-values',
      body: PanelBuilders.timeseries()
        .setTitle(item.label)
        .setData(data)
        .setHeaderActions(headerActions(item))
        .setMin(0)
        .setCustomFieldConfig('fillOpacity', 0)
        .build(),
    });

    if (!displayAllValues) {
      this.addActivationHandler(this.onActivate.bind(this, item));
    }
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
    const totalSeriesCount =
      series[0].meta?.stats?.find(({ displayName }) => displayName === 'totalSeriesCount')?.value || 0;

    const hasTooManySeries = totalSeriesCount > LabelsDataSource.MAX_TIMESERIES_LABEL_VALUES;

    const description = hasTooManySeries
      ? `The number of series on this panel has been reduced from ${totalSeriesCount} to ${LabelsDataSource.MAX_TIMESERIES_LABEL_VALUES} to preserve readability. To view all the data, click on the expand icon on this panel.`
      : undefined;

    return {
      title: series.length > 1 ? `${item.label} (${series.length})` : item.label,
      description,
      fieldConfig: {
        defaults: {
          min: 0,
          custom: {
            fillOpacity: series.length === LabelsDataSource.MAX_TIMESERIES_LABEL_VALUES ? 0 : 9,
            gradientMode: series.length === 1 ? GraphGradientMode.None : GraphGradientMode.Opacity,
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

  static Component({ model }: SceneComponentProps<SceneLabelValuesTimeseries>) {
    const { body } = model.useState();

    return <body.Component model={body} />;
  }
}
