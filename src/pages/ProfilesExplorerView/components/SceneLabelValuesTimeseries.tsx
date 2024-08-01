import { DataFrame, FieldMatcherID, getValueFormat, LoadingState } from '@grafana/data';
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

import { getColorByIndex } from '../helpers/getColorByIndex';
import { LabelsDataSource } from '../infrastructure/labels/LabelsDataSource';
import { buildTimeSeriesQueryRunner } from '../infrastructure/timeseries/buildTimeSeriesQueryRunner';
import {
  addRefId,
  addStats,
  limitNumberOfSeries,
  sortSeries,
} from './SceneByVariableRepeaterGrid/infrastructure/data-transformations';
import { GridItemData } from './SceneByVariableRepeaterGrid/types/GridItemData';

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
    headerActions: () => VizPanelState['headerActions'];
    displayAllValues?: boolean;
  }) {
    super({
      key: 'timeseries-label-values',
      body: PanelBuilders.timeseries()
        .setTitle(item.label)
        .setData(
          new SceneDataTransformer({
            $data: buildTimeSeriesQueryRunner(item.queryRunnerParams),
            transformations: displayAllValues
              ? [addRefId, addStats, sortSeries]
              : [addRefId, addStats, sortSeries, limitNumberOfSeries],
          })
        )
        .setHeaderActions(headerActions())
        .build(),
    });

    this.addActivationHandler(this.onActivate.bind(this, item, Boolean(displayAllValues)));
  }

  onActivate(item: GridItemData, displayAllValues: boolean) {
    const { body } = this.state;

    const sub = (body.state.$data as SceneDataTransformer)!.subscribeToState((state) => {
      if (state.data?.state !== LoadingState.Done || !state.data.series.length) {
        return;
      }

      const config = displayAllValues
        ? this.getAllValuesConfig(item, state.data.series)
        : this.getConfig(item, state.data.series);

      body.setState(config);
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
            fillOpacity: series.length >= LabelsDataSource.MAX_TIMESERIES_LABEL_VALUES ? 0 : 9,
            gradientMode: series.length === 1 ? GraphGradientMode.None : GraphGradientMode.Opacity,
          },
        },
        overrides: this.getOverrides(item, series),
      },
    };
  }

  getAllValuesConfig(item: GridItemData, series: DataFrame[]) {
    return {
      fieldConfig: {
        defaults: {
          min: 0,
          custom: {
            fillOpacity: 0,
          },
        },
        overrides: this.getOverrides(item, series),
      },
    };
  }

  getOverrides(item: GridItemData, series: DataFrame[]) {
    const groupByLabel = item.queryRunnerParams.groupBy?.label;

    return series.map((serie, i) => {
      let displayName = groupByLabel ? serie.fields[1].labels?.[groupByLabel] : serie.fields[1].name;

      if (series.length === 1) {
        const allValuesSum = serie.meta?.stats?.find(({ displayName }) => displayName === 'allValuesSum')?.value || 0;
        const { unit } = serie.fields[1].config;
        const formattedValue = getValueFormat(unit)(allValuesSum);

        displayName = `${displayName} · total = ${formattedValue.text}${formattedValue.suffix}`;
      }

      return {
        matcher: { id: FieldMatcherID.byFrameRefID, options: serie.refId },
        properties: [
          {
            id: 'displayName',
            value: displayName,
          },
          {
            id: 'color',
            value: { mode: 'fixed', fixedColor: getColorByIndex(item.index + i) },
          },
        ],
      };
    });
  }

  static Component({ model }: SceneComponentProps<SceneLabelValuesTimeseries>) {
    const { body } = model.useState();

    return <body.Component model={body} />;
  }
}
