import { PanelMenuItem, PluginExtensionLink } from '@grafana/data';
import { reportInteraction } from '@grafana/runtime';
import {
  SceneComponentProps,
  SceneDataQuery,
  sceneGraph,
  SceneObjectBase,
  SceneObjectState,
  SceneQueryRunner,
  VizPanelMenu,
} from '@grafana/scenes';
import { ScaleDistribution, ScaleDistributionConfig } from '@grafana/schema';
import PyroscopeLogo from '@img/logo.svg';
import { parseQuery } from '@shared/domain/url-params/parseQuery';
import { nanoid } from 'nanoid';
import React, { useEffect, useMemo } from 'react';

import {
  INVESTIGATIONS_APP_ID,
  INVESTIGATIONS_EXTENSTION_POINT_ID,
  useGetPluginExtensionLink,
} from '../../domain/useGetPluginExtensionLink';
import { getExploreUrl } from '../../helpers/getExploreUrl';
import { getProfileMetricLabel } from '../../infrastructure/series/helpers/getProfileMetricLabel';
import { TimeSeriesQuery } from '../../infrastructure/timeseries/buildTimeSeriesQueryRunner';
import { SceneLabelValuesTimeseries } from './SceneLabelValuesTimeseries';

interface SceneTimeseriesMenuState extends SceneObjectState {
  items?: PanelMenuItem[];
  scaleType?: ScaleDistribution;
}

const SCALE_TYPES = [
  {
    text: 'Linear',
    scaleDistribution: { type: ScaleDistribution.Linear },
  },
  {
    text: 'Log2',
    scaleDistribution: { type: ScaleDistribution.Log, log: 2 },
  },
];

export class SceneTimeseriesMenu extends SceneObjectBase<SceneTimeseriesMenuState> {
  constructor(state: SceneTimeseriesMenuState) {
    super({
      scaleType: ScaleDistribution.Linear,
      ...state,
    });

    this.addActivationHandler(this.onActivate.bind(this));
  }

  onActivate() {
    this.setState({ items: this.buildMenuItems() });
  }

  buildMenuItems(addToInvestigationLink?: PluginExtensionLink): PanelMenuItem[] {
    const { items, scaleType } = this.state;

    const menuItems: PanelMenuItem[] = [
      {
        text: 'Scale type',
        type: 'group',
        subMenu: SCALE_TYPES.map((option) => ({
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

    if (addToInvestigationLink) {
      menuItems.push({
        iconClassName: 'plus-square',
        text: 'Add to investigation (beta)',
        onClick: () => {
          addToInvestigationLink.onClick!();
        },
      });
    } else {
      const existingAddToInvestigationItem = items?.find((i) => i.text.includes('Add to investigation'));

      if (existingAddToInvestigationItem) {
        menuItems.push({ ...existingAddToInvestigationItem });
      }
    }

    return menuItems;
  }

  onClickScaleOption(option: PanelMenuItem & { scaleDistribution: ScaleDistributionConfig }) {
    const { scaleDistribution, text } = option;

    reportInteraction('g_pyroscope_app_timeseries_scale_changed', { scale: scaleDistribution.type });

    const timeseries = sceneGraph.getAncestor(this, SceneLabelValuesTimeseries);

    timeseries.changeScale(scaleDistribution, text);

    this.setState({
      scaleType: scaleDistribution.type,
      items: this.buildMenuItems(),
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

  getInterpolatedQuery() {
    const timeseries = sceneGraph.getAncestor(this, SceneLabelValuesTimeseries);
    const queryRunner = timeseries.state.body.state.$data?.state.$data as SceneQueryRunner;
    const nonInterpolatedQuery = queryRunner?.state.queries[0] as SceneDataQuery;

    return Object.entries(nonInterpolatedQuery)
      .map(([key, value]) => [key, typeof value === 'string' ? sceneGraph.interpolate(this, value) : value])
      .reduce(
        (acc, [key, value]) => ({
          ...acc,
          [key]: value,
        }),
        {}
      ) as TimeSeriesQuery;
  }

  useGetInvestigationPluginLinkContext() {
    const { refId, queryType, profileTypeId, labelSelector, groupBy } = this.getInterpolatedQuery();

    const parsedQuery = parseQuery(`${profileTypeId}${labelSelector}`);
    const titleParts = [parsedQuery.serviceId, getProfileMetricLabel(parsedQuery.profileMetricId)];

    if (groupBy?.length) {
      titleParts.push(groupBy[0]);
    }

    if (parsedQuery.labels.length) {
      titleParts.push(parsedQuery.labels.join(', '));
    }

    const title = titleParts.join(' · ');
    const datasource = sceneGraph.interpolate(this, '${dataSource}');
    const timeRange = sceneGraph.getTimeRange(this).state.value;

    // eslint-disable-next-line react-hooks/rules-of-hooks
    return useMemo(() => {
      return {
        id: nanoid(),
        origin: 'Grafana Profiles Drilldown',
        url: window.location.href,
        logoPath: PyroscopeLogo,
        title,
        type: 'timeseries',
        timeRange: { ...timeRange },
        queries: [{ refId, queryType, profileTypeId, labelSelector, groupBy }],
        datasource,
      };
    }, [datasource, groupBy, labelSelector, profileTypeId, queryType, refId, timeRange, title]);
  }

  useUpdateMenuItems() {
    const context = this.useGetInvestigationPluginLinkContext();

    // eslint-disable-next-line react-hooks/rules-of-hooks
    const link = useGetPluginExtensionLink({
      extensionPointId: INVESTIGATIONS_EXTENSTION_POINT_ID,
      context,
      pluginId: INVESTIGATIONS_APP_ID,
    });

    // wrapped in a useEffect to prevent a warning when clicking on the "Add to investigation" link
    // ("Cannot update a component while rendering a different component")

    // eslint-disable-next-line react-hooks/rules-of-hooks
    useEffect(() => {
      if (link) {
        this.setState({ items: this.buildMenuItems(link) });
      }
    }, [link]);
  }

  static Component({ model }: SceneComponentProps<SceneTimeseriesMenu>) {
    model.useUpdateMenuItems();

    return <VizPanelMenu.Component model={model as unknown as VizPanelMenu} />;
  }
}
