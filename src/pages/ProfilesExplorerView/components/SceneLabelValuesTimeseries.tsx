import { DataFrame, FieldMatcherID, getValueFormat, LoadingState, PanelMenuItem } from '@grafana/data';
import {
  PanelBuilders,
  SceneComponentProps,
  SceneDataProvider,
  SceneDataQuery,
  SceneDataTransformer,
  sceneGraph,
  SceneObjectBase,
  SceneObjectState,
  SceneQueryRunner,
  VizPanel,
  VizPanelMenu,
  VizPanelState,
} from '@grafana/scenes';
import { GraphGradientMode, ScaleDistribution, ScaleDistributionConfig, SortOrder } from '@grafana/schema';
import { LegendDisplayMode, TooltipDisplayMode, VizLegendOptions } from '@grafana/ui';
import { reportInteraction } from '@shared/domain/reportInteraction';
import { merge } from 'lodash';
import React from 'react';

import { EventTimeseriesDataReceived } from '../domain/events/EventTimeseriesDataReceived';
import { getColorByIndex } from '../helpers/getColorByIndex';
import { getExploreUrl } from '../helpers/getExploreUrl';
import { getSeriesLabelFieldName } from '../infrastructure/helpers/getSeriesLabelFieldName';
import { getSeriesStatsValue } from '../infrastructure/helpers/getSeriesStatsValue';
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
    data?: SceneDataProvider;
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

    body.setState({ menu: this.buildMenu() });

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

  buildMenu(selectedScaleIndex = 0): VizPanelMenu {
    const scaleSubMenu = [
      {
        index: 0,
        text: 'Linear',
        scaleDistribution: { type: ScaleDistribution.Linear },
      },
      {
        index: 1,
        text: 'Log2',
        scaleDistribution: { type: ScaleDistribution.Log, log: 2 },
      },
    ].map((option) => ({
      text: `${selectedScaleIndex === option.index ? '✔ ' : ''}${option.text}`,
      onClick: () => this.onClickScaleOption(option),
    }));

    return new VizPanelMenu({
      items: [
        {
          text: 'Scale type',
          type: 'group',
          subMenu: scaleSubMenu,
        },
        {
          type: 'divider',
          text: '',
        },
        {
          iconClassName: 'compass',
          text: 'Open in Explore',
          onClick: () => this.onClickExplore(),
        },
      ],
    });
  }

  onClickScaleOption(option: PanelMenuItem & { index: number; scaleDistribution: ScaleDistributionConfig }) {
    const { scaleDistribution, text, index } = option;
    const { body } = this.state;

    reportInteraction('g_pyroscope_app_timeseries_scale_change', { scale: scaleDistribution.type });

    body.clearFieldConfigCache();

    body.setState({
      menu: this.buildMenu(index),
      fieldConfig: merge({}, body.state.fieldConfig, {
        defaults: {
          custom: {
            scaleDistribution,
            axisLabel: scaleDistribution.type !== ScaleDistribution.Linear ? text : '',
          },
        },
      }),
    });
  }

  onClickExplore() {
    reportInteraction('g_pyroscope_app_open_in_explore');

    const queryRunner = this.state.body.state.$data?.state.$data as SceneQueryRunner;
    const nonInterpolatedQuery = queryRunner?.state.queries[0];

    const query = Object.entries(nonInterpolatedQuery)
      .map(([key, value]) => [key, typeof value === 'string' ? sceneGraph.interpolate(this, value) : value])
      .reduce(
        (acc, [key, value]) => ({
          ...acc,
          [key]: value,
        }),
        {}
      ) as SceneDataQuery;

    const datasource = sceneGraph.interpolate(this, '${dataSource}');
    const rawTimeRange = sceneGraph.getTimeRange(this).state.value.raw;

    const exploreUrl = getExploreUrl(rawTimeRange, query, datasource);

    window.open(exploreUrl, '_blank');
  }

  getConfig(series: DataFrame[]) {
    const { body, item, legendPlacement } = this.state;
    let { title } = body.state;
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

  updateTitle(newTitle: string) {
    this.state.body.setState({ title: newTitle });
  }

  static Component({ model }: SceneComponentProps<SceneLabelValuesTimeseries>) {
    const { body } = model.useState();

    return <body.Component model={body} />;
  }
}
