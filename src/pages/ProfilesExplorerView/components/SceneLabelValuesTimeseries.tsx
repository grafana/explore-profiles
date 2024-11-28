import { DataFrame, FieldMatcherID, getValueFormat, LoadingState, PanelMenuItem } from '@grafana/data';
import { usePluginLinks } from '@grafana/runtime';
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
import PyroscopeLogo from '@img/logo.svg';
import { reportInteraction } from '@shared/domain/reportInteraction';
import { parseQuery } from '@shared/domain/url-params/parseQuery';
import { logger } from '@shared/infrastructure/tracking/logger';
import { merge } from 'lodash';
import { nanoid } from 'nanoid';
import React, { useMemo } from 'react';

import { INVESTIGATIONS_APP_ID, INVESTIGATIONS_EXTENSTION_POINT_ID } from '../../../constants';
import { EventTimeseriesDataReceived } from '../domain/events/EventTimeseriesDataReceived';
import { getColorByIndex } from '../helpers/getColorByIndex';
import { getExploreUrl } from '../helpers/getExploreUrl';
import { getSeriesLabelFieldName } from '../infrastructure/helpers/getSeriesLabelFieldName';
import { getSeriesStatsValue } from '../infrastructure/helpers/getSeriesStatsValue';
import { LabelsDataSource } from '../infrastructure/labels/LabelsDataSource';
import { getProfileMetricLabel } from '../infrastructure/series/helpers/getProfileMetricLabel';
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
  scaleType: ScaleDistribution;
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
      scaleType: ScaleDistribution.Linear,
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

  getInterpolatedQuery() {
    const queryRunner = this.state.body.state.$data?.state.$data as SceneQueryRunner;
    const nonInterpolatedQuery = queryRunner?.state.queries[0];

    return Object.entries(nonInterpolatedQuery)
      .map(([key, value]) => [key, typeof value === 'string' ? sceneGraph.interpolate(this, value) : value])
      .reduce(
        (acc, [key, value]) => ({
          ...acc,
          [key]: value,
        }),
        {}
      ) as SceneDataQuery;
  }

  onClickScaleOption(option: PanelMenuItem & { scaleDistribution: ScaleDistributionConfig }) {
    const { scaleType: currentScaleType, body } = this.state;
    const { scaleDistribution, text } = option;

    if (currentScaleType === scaleDistribution.type) {
      return;
    }

    reportInteraction('g_pyroscope_app_timeseries_scale_changed', { scale: scaleDistribution.type });

    this.setState({ scaleType: scaleDistribution.type });

    body.clearFieldConfigCache();

    body.setState({
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
    reportInteraction('g_pyroscope_app_open_in_explore_clicked');

    const rawTimeRange = sceneGraph.getTimeRange(this).state.value.raw;
    const query = this.getInterpolatedQuery();
    const datasource = sceneGraph.interpolate(this, '${dataSource}');

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

  useInvestigationPluginLinkContext() {
    const query = this.getInterpolatedQuery();

    const { serviceId, profileMetricId, labels } = parseQuery(`${query.profileTypeId}${query.labelSelector}`);
    const titleParts = [serviceId, getProfileMetricLabel(profileMetricId)];

    if (query.groupBy?.length) {
      titleParts.push(query.groupBy[0]);
    }

    if (labels.length) {
      titleParts.push(labels.join(', '));
    }

    return {
      id: nanoid(),
      origin: 'Explore Profiles',
      url: window.location.href,
      logoPath: PyroscopeLogo,
      title: titleParts.join(' · '),
      type: 'timeseries',
      timeRange: { ...sceneGraph.getTimeRange(this).state.value },
      queries: [query],
      datasource: sceneGraph.interpolate(this, '${dataSource}'),
    };
  }

  useAddToInvestigationLink() {
    const context = this.useInvestigationPluginLinkContext();

    // eslint-disable-next-line react-hooks/rules-of-hooks
    const pluginLinks = usePluginLinks({
      extensionPointId: INVESTIGATIONS_EXTENSTION_POINT_ID,
      context,
    });

    const [link] = pluginLinks.links.filter((link) => link.pluginId === INVESTIGATIONS_APP_ID);

    if (!link?.onClick) {
      logger.warn(
        `No valid plugin link found for extension point "${INVESTIGATIONS_EXTENSTION_POINT_ID}" and plugin id="${INVESTIGATIONS_APP_ID}"!`
      );

      return null;
    }

    return link;
  }

  useBuildMenu() {
    const { scaleType } = this.state;

    const link = this.useAddToInvestigationLink();

    // eslint-disable-next-line react-hooks/rules-of-hooks
    const menu: VizPanelMenu = useMemo(() => {
      const items: PanelMenuItem[] = [
        {
          text: 'Scale type',
          type: 'group',
          subMenu: [
            {
              text: 'Linear',
              scaleDistribution: { type: ScaleDistribution.Linear },
            },
            {
              text: 'Log2',
              scaleDistribution: { type: ScaleDistribution.Log, log: 2 },
            },
          ].map((option) => ({
            text: `${scaleType === option.scaleDistribution.type ? '✔ ' : ''}${option.text}`,
            onClick: () => this.onClickScaleOption(option),
          })),
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
      ];

      if (link) {
        items.push({
          iconClassName: 'plus-square',
          text: 'Add to investigation',
          onClick: () => {
            link.onClick!();
          },
        });
      }

      return new VizPanelMenu({ items });
    }, [link, scaleType]);

    this.state.body.setState({ menu });
  }

  static Component({ model }: SceneComponentProps<SceneLabelValuesTimeseries>) {
    const { body } = model.useState();

    model.useBuildMenu();

    return <body.Component model={body} />;
  }
}
