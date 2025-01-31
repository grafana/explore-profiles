import { DataFrame, FieldMatcherID, getValueFormat, LoadingState } from '@grafana/data';
import {
  PanelBuilders,
  SceneComponentProps,
  SceneDataProvider,
  SceneDataTransformer,
  SceneObjectBase,
  SceneObjectState,
  SceneQueryRunner,
  VizPanel,
  VizPanelMenu,
  VizPanelState,
} from '@grafana/scenes';
import { GraphGradientMode, ScaleDistribution, ScaleDistributionConfig, SortOrder } from '@grafana/schema';
import { LegendDisplayMode, TooltipDisplayMode, VizLegendOptions } from '@grafana/ui';
import { isEqual, merge } from 'lodash';
import React from 'react';

import { EventTimeseriesDataReceived } from '../../domain/events/EventTimeseriesDataReceived';
import { getColorByIndex } from '../../helpers/getColorByIndex';
import { getSeriesLabelFieldName } from '../../infrastructure/helpers/getSeriesLabelFieldName';
import { getSeriesStatsValue } from '../../infrastructure/helpers/getSeriesStatsValue';
import { LabelsDataSource } from '../../infrastructure/labels/LabelsDataSource';
import { buildTimeSeriesQueryRunner } from '../../infrastructure/timeseries/buildTimeSeriesQueryRunner';
import { addRefId, addStats } from '../SceneByVariableRepeaterGrid/infrastructure/data-transformations';
import { GridItemData } from '../SceneByVariableRepeaterGrid/types/GridItemData';
import { SceneTimeseriesMenu } from './SceneTimeseriesMenu';

interface SceneLabelValuesTimeseriesState extends SceneObjectState {
  item: GridItemData;
  headerActions: (item: GridItemData) => VizPanelState['headerActions'];
  body: VizPanel;
  displayAllValues: boolean;
  legendPlacement: VizLegendOptions['placement'];
  overrides?: (series: DataFrame[]) => VizPanelState['fieldConfig']['overrides'];
}

export class SceneLabelValuesTimeseries extends SceneObjectBase<SceneLabelValuesTimeseriesState> {
  constructor({
    item,
    headerActions,
    displayAllValues,
    legendPlacement,
    data,
    overrides,
  }: {
    item: SceneLabelValuesTimeseriesState['item'];
    headerActions: SceneLabelValuesTimeseriesState['headerActions'];
    displayAllValues?: SceneLabelValuesTimeseriesState['displayAllValues'];
    legendPlacement?: SceneLabelValuesTimeseriesState['legendPlacement'];
    data?: SceneDataTransformer;
    overrides?: SceneLabelValuesTimeseriesState['overrides'];
  }) {
    super({
      key: 'timeseries-label-values',
      item,
      headerActions,
      displayAllValues: Boolean(displayAllValues),
      legendPlacement: legendPlacement || 'bottom',
      overrides,
      body: PanelBuilders.timeseries()
        .setTitle(item.label)
        .setData(
          data ||
            new SceneDataTransformer({
              $data: buildTimeSeriesQueryRunner(
                item.queryRunnerParams,
                displayAllValues ? undefined : LabelsDataSource.MAX_TIMESERIES_LABEL_VALUES
              ),
              transformations: [addRefId, addStats],
            })
        )
        .setHeaderActions(headerActions(item))
        .setMenu(new SceneTimeseriesMenu({}) as unknown as VizPanelMenu)
        .build(),
    });

    this.addActivationHandler(this.onActivate.bind(this));
  }

  onActivate() {
    const { body } = this.state;

    const sub = (body.state.$data as SceneDataProvider).subscribeToState((newState, prevState) => {
      if (newState.data?.state !== LoadingState.Done) {
        return;
      }

      // ensure we retain the previous annotations, if they exist
      if (!newState.data.annotations?.length && prevState.data?.annotations?.length) {
        newState.data.annotations = prevState.data.annotations;
      }

      const { series } = newState.data;

      if (series?.length) {
        const config = this.state.displayAllValues ? this.getAllValuesConfig(series) : this.getConfig(series);
        body.setState(merge({}, body.state, config));
      }

      // we publish the event only after setting the new config so that the subscribers can modify it
      // (e.g. sync y-axis in SceneExploreDiffFlameGraphs.tsx)
      this.publishEvent(new EventTimeseriesDataReceived({ series }), true);
    });

    return () => {
      sub.unsubscribe();
    };
  }

  getConfig(series: DataFrame[]) {
    const { body, item, legendPlacement } = this.state;
    let { title } = body.state;
    let description;

    if (item.queryRunnerParams.groupBy?.label) {
      title = series.length > 1 ? `${item.label} (${series.length})` : item.label;
      description = this.buildDescription(item.queryRunnerParams.groupBy!);
    }

    return {
      title,
      description,
      options: {
        tooltip: {
          mode: 'single',
          sort: 'none',
        },
        legend: {
          showLegend: true,
          displayMode: 'list',
          placement: legendPlacement,
        },
      },
      fieldConfig: {
        defaults: {
          min: 0,
          custom: {
            fillOpacity: series.length >= LabelsDataSource.MAX_TIMESERIES_LABEL_VALUES ? 0 : 9,
            gradientMode: series.length === 1 ? GraphGradientMode.None : GraphGradientMode.Opacity,
            pointSize: 3,
          },
        },
        overrides: this.getOverrides(series),
      },
    };
  }

  buildDescription(groupBy: GridItemData['queryRunnerParams']['groupBy']) {
    if (!groupBy) {
      return '';
    }

    // this case is for favorites: they are stored in localStorage without the `values` array
    if (!groupBy!.values) {
      return `Showing only ${LabelsDataSource.MAX_TIMESERIES_LABEL_VALUES} series to preserve readability. To view all the series, click on the expand icon on this panel.`;
    }

    if (groupBy!.values.length > LabelsDataSource.MAX_TIMESERIES_LABEL_VALUES) {
      return `Showing only ${LabelsDataSource.MAX_TIMESERIES_LABEL_VALUES} out of ~${
        groupBy!.values.length
      } series to preserve readability. To view all the series for the current filters, click on the expand icon on this panel.`;
    }

    return '';
  }

  getAllValuesConfig(series: DataFrame[]) {
    const { legendPlacement } = this.state;

    return {
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
          min: 0,
          custom: {
            fillOpacity: 0,
            pointSize: 5,
          },
        },
        overrides: this.getOverrides(series),
      },
    };
  }

  getOverrides(series: DataFrame[]) {
    if (this.state.overrides) {
      return this.state.overrides(series);
    }

    const { item } = this.state;
    const groupByLabel = item.queryRunnerParams.groupBy?.label;

    return series.map((s, i) => {
      const metricField = s.fields[1];
      let displayName = groupByLabel ? getSeriesLabelFieldName(metricField, groupByLabel) : metricField.name;

      if (series.length === 1) {
        const allValuesSum = getSeriesStatsValue(s, 'allValuesSum') || 0;
        const formattedValue = getValueFormat(metricField.config.unit)(allValuesSum);

        displayName = `total ${displayName} = ${formattedValue.text}${formattedValue.suffix}`;
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
  }

  updateItem(partialItem: Partial<GridItemData>) {
    const { item, headerActions, body } = this.state;
    const updatedItem = merge({}, item, partialItem);

    if (partialItem.queryRunnerParams?.hasOwnProperty('groupBy')) {
      if (partialItem.queryRunnerParams.groupBy === undefined) {
        delete updatedItem.queryRunnerParams.groupBy;
      } else {
        // we completely replace groupBy because merge() above concatenates groupBy.values
        updatedItem.queryRunnerParams.groupBy = partialItem.queryRunnerParams.groupBy;
      }
    }

    if (
      partialItem.queryRunnerParams?.hasOwnProperty('filters') &&
      partialItem.queryRunnerParams.filters === undefined
    ) {
      delete updatedItem.queryRunnerParams.filters;
    }

    this.setState({ item: updatedItem });

    body.setState({
      title: partialItem.label,
      description: this.buildDescription(updatedItem.queryRunnerParams.groupBy),
      headerActions: headerActions(updatedItem),
    });

    if (!isEqual(item.queryRunnerParams, updatedItem.queryRunnerParams)) {
      const { queries } = buildTimeSeriesQueryRunner(
        updatedItem.queryRunnerParams,
        LabelsDataSource.MAX_TIMESERIES_LABEL_VALUES
      ).state;

      const queryRunner = body.state.$data?.state.$data as SceneQueryRunner;

      // this allows us not to have to subscribe to the data provider changes as we do in onActivate() above
      queryRunner?.setState({ queries });
      queryRunner?.runQueries();
    }
  }

  changeScale(scaleDistribution: ScaleDistributionConfig, axisLabel: string) {
    const { body } = this.state;

    body.clearFieldConfigCache();

    body.setState({
      fieldConfig: merge({}, body.state.fieldConfig, {
        defaults: {
          custom: {
            scaleDistribution,
            axisLabel: scaleDistribution.type !== ScaleDistribution.Linear ? axisLabel : '',
          },
        },
      }),
    });
  }

  static Component({ model }: SceneComponentProps<SceneLabelValuesTimeseries>) {
    const { body } = model.useState();

    return <body.Component model={body} />;
  }
}
