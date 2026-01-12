import { PanelMenuItem } from '@grafana/data';
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
import React from 'react';

import { getExploreUrl } from '../../helpers/getExploreUrl';
import { TimeSeriesQuery } from '../../infrastructure/timeseries/buildTimeSeriesQueryRunner';
import { SceneLabelValuesTimeseries } from './SceneLabelValuesTimeseries';

interface SceneTimeseriesMenuState extends SceneObjectState {
  items?: PanelMenuItem[];
  scaleType?: ScaleDistribution;
  showExemplars?: boolean; // undefined means that the Exemplars button is not shown in the menu. Otherwise, it's shown and the value is the current state of the Exemplars button.
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

  buildMenuItems(): PanelMenuItem[] {
    const { scaleType, showExemplars } = this.state;

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

    if (showExemplars !== undefined) {
      menuItems.unshift(
        {
          iconClassName: showExemplars ? 'eye' : 'eye-slash',
          text: 'Exemplars',
          onClick: () => this.onClickToggleExemplars(),
        },
        {
          type: 'divider',
          text: 'new-divider',
        }
      );
    }

    return menuItems;
  }

  private onClickToggleExemplars() {
    const newShowExemplars = !this.state.showExemplars;

    reportInteraction('g_pyroscope_app_exemplars_toggled', {
      showExemplars: newShowExemplars,
    });

    this.setState({
      showExemplars: newShowExemplars,
      items: this.buildMenuItems(),
    });

    const timeseries = sceneGraph.getAncestor(this, SceneLabelValuesTimeseries);
    timeseries.handleExemplarToggleChange(newShowExemplars);
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

  static Component({ model }: SceneComponentProps<SceneTimeseriesMenu>) {
    return <VizPanelMenu.Component model={model as unknown as VizPanelMenu} />;
  }
}
