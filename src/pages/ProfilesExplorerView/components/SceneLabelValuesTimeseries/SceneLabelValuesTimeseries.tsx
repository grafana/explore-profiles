import { DataFrame, FieldMatcherID, getValueFormat, LoadingState } from '@grafana/data';
import {
  PanelBuilders,
  SceneComponentProps,
  SceneDataProvider,
  SceneDataTransformer,
  SceneObjectBase,
  SceneObjectState,
  VizPanel,
  VizPanelState,
} from '@grafana/scenes';
import { GraphGradientMode } from '@grafana/schema';
import React from 'react';

import { getColorByIndex } from '../../helpers/getColorByIndex';
import { getLabelFieldName } from '../../helpers/getLabelFieldName';
import { LabelsDataSource } from '../../infrastructure/labels/LabelsDataSource';
import { buildTimeSeriesQueryRunner } from '../../infrastructure/timeseries/buildTimeSeriesQueryRunner';
import {
  addRefId,
  addStats,
  limitNumberOfSeries,
  sortSeries,
} from '../SceneByVariableRepeaterGrid/infrastructure/data-transformations';
import { GridItemData } from '../SceneByVariableRepeaterGrid/types/GridItemData';
import { getSeriesStatsValue } from '../SceneExploreServiceLabels/components/SceneGroupByLabels/components/SceneLabelValuesGrid/domain/getSeriesStatsValue';
import { EventDataReceived } from './domain/events/EventDataReceived';

interface SceneLabelValuesTimeseriesState extends SceneObjectState {
  item: GridItemData;
  headerActions: (item: GridItemData) => VizPanelState['headerActions'];
  displayAllValues: boolean;
  body: VizPanel;
  overrides: (series: DataFrame[]) => VizPanelState['fieldConfig']['overrides'];
}

export class SceneLabelValuesTimeseries extends SceneObjectBase<SceneLabelValuesTimeseriesState> {
  constructor({
    item,
    headerActions,
    displayAllValues,
    data,
    overrides,
  }: {
    item: SceneLabelValuesTimeseriesState['item'];
    headerActions: SceneLabelValuesTimeseriesState['headerActions'];
    displayAllValues?: SceneLabelValuesTimeseriesState['displayAllValues'];
    data?: SceneDataProvider;
    overrides?: SceneLabelValuesTimeseriesState['overrides'];
  }) {
    super({
      key: 'timeseries-label-values',
      item,
      headerActions,
      displayAllValues: Boolean(displayAllValues),
      overrides: overrides || (() => []),
      body: PanelBuilders.timeseries()
        .setTitle(item.label)
        .setData(
          data ||
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
      if (state.data?.state !== LoadingState.Done) {
        return;
      }

      const { series } = state.data;

      this.publishEvent(new EventDataReceived({ series }), true);

      if (!series.length) {
        return;
      }

      const config = this.state.displayAllValues ? this.getAllValuesConfig(series) : this.getConfig(series);

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

      const totalSeriesCount = getSeriesStatsValue(series[0], 'totalSeriesCount') || 0;
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

    const defaultOverrides = series.map((s, i) => {
      const metricField = s.fields[1];
      let displayName = getLabelFieldName(metricField, groupByLabel);

      if (series.length === 1) {
        const allValuesSum = getSeriesStatsValue(s, 'allValuesSum') || 0;
        const formattedValue = getValueFormat(metricField.config.unit)(allValuesSum);

        displayName = `${displayName} / total = ${formattedValue.text}${formattedValue.suffix}`;
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
            value: { mode: 'fixed', fixedColor: getColorByIndex(item.index + i) },
          },
        ],
      };
    });

    return [...defaultOverrides, ...this.state.overrides(series)];
  }

  updateTitle(newTitle: string) {
    this.state.body.setState({ title: newTitle });
  }

  static Component({ model }: SceneComponentProps<SceneLabelValuesTimeseries>) {
    const { body } = model.useState();

    return <body.Component model={body} />;
  }
}