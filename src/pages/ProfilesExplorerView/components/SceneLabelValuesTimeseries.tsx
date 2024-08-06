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
  item: GridItemData;
  headerActions: (item: GridItemData) => VizPanelState['headerActions'];
  displayAllValues: boolean;
  body: VizPanel;
}

export class SceneLabelValuesTimeseries extends SceneObjectBase<SceneLabelValuesTimeseriesState> {
  constructor({
    item,
    headerActions,
    displayAllValues,
  }: {
    item: SceneLabelValuesTimeseriesState['item'];
    headerActions: SceneLabelValuesTimeseriesState['headerActions'];
    displayAllValues?: SceneLabelValuesTimeseriesState['displayAllValues'];
  }) {
    super({
      key: 'timeseries-label-values',
      item,
      headerActions,
      displayAllValues: Boolean(displayAllValues),
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
        .setHeaderActions(headerActions(item))
        .build(),
    });

    this.addActivationHandler(this.onActivate.bind(this));
  }

  onActivate() {
    const { body } = this.state;

    const sub = (body.state.$data as SceneDataTransformer)!.subscribeToState((state) => {
      if (state.data?.state !== LoadingState.Done || !state.data.series.length) {
        return;
      }

      const config = this.state.displayAllValues
        ? this.getAllValuesConfig(state.data.series)
        : this.getConfig(state.data.series);

      body.setState(config);
    });

    return () => {
      sub.unsubscribe();
    };
  }

  getConfig(series: DataFrame[]) {
    const { item } = this.state;
    let { title } = this.state.body.state;
    let description;

    if (item.queryRunnerParams.groupBy?.label) {
      title = series.length > 1 ? `${item.label} (${series.length})` : item.label;

      const totalSeriesCount =
        series[0].meta?.stats?.find(({ displayName }) => displayName === 'totalSeriesCount')?.value || 0;
      const hasTooManySeries = totalSeriesCount > LabelsDataSource.MAX_TIMESERIES_LABEL_VALUES;

      description = hasTooManySeries
        ? `The number of series on this panel has been reduced from ${totalSeriesCount} to ${LabelsDataSource.MAX_TIMESERIES_LABEL_VALUES} to preserve readability. To view all the data, click on the expand icon on this panel.`
        : undefined;
    }

    return {
      title,
      description,
      fieldConfig: {
        defaults: {
          min: 0,
          custom: {
            fillOpacity: series.length >= LabelsDataSource.MAX_TIMESERIES_LABEL_VALUES ? 0 : 9,
            gradientMode: series.length === 1 ? GraphGradientMode.None : GraphGradientMode.Opacity,
          },
        },
        overrides: this.getOverrides(series),
      },
    };
  }

  getAllValuesConfig(series: DataFrame[]) {
    return {
      fieldConfig: {
        defaults: {
          min: 0,
          custom: {
            fillOpacity: 0,
          },
        },
        overrides: this.getOverrides(series),
      },
    };
  }

  getOverrides(series: DataFrame[]) {
    const { item } = this.state;
    const groupByLabel = item.queryRunnerParams.groupBy?.label;

    return series.map((serie, i) => {
      let displayName = serie.fields[1].labels?.[groupByLabel as string] || serie.fields[1].name;

      if (series.length === 1) {
        const allValuesSum = serie.meta?.stats?.find(({ displayName }) => displayName === 'allValuesSum')?.value || 0;
        const { unit } = serie.fields[1].config;
        const formattedValue = getValueFormat(unit)(allValuesSum);

        displayName = `${displayName} / total = ${formattedValue.text}${formattedValue.suffix}`;
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

  getGroupByValues(series: DataFrame[]) {
    const groupByLabel = this.state.item.queryRunnerParams.groupBy?.label;
    return series.map((serie) => serie.fields[1].labels?.[groupByLabel as string] || serie.fields[1].name);
  }

  updateTitle(newTitle: string) {
    this.state.body.setState({ title: newTitle });
  }

  static Component({ model }: SceneComponentProps<SceneLabelValuesTimeseries>) {
    const { body } = model.useState();

    return <body.Component model={body} />;
  }
}
