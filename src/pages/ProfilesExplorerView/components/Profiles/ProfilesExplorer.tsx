import { DashboardCursorSync, TimeRange } from '@grafana/data';
import {
  behaviors,
  EmbeddedScene,
  PanelBuilders,
  SceneCSSGridItem,
  SceneCSSGridLayout,
  SceneRefreshPicker,
  SceneTimePicker,
  SceneTimeRange,
  SceneVariableSet,
  VariableValueSelectors,
} from '@grafana/scenes';
import { Services } from '@shared/infrastructure/services/servicesApiClient';
import { userStorage } from '@shared/infrastructure/userStorage';

import { fetchLabelsData } from '../fetchLabelsData';
import { getColorByIndex } from '../getColorByIndex';
import { getProfileMetricOptions } from '../getProfileMetricOptions';
import { getServiceOptions } from '../getServiceOptions';
import { PinServiceAction } from '../PinServiceAction';
import { SelectLabelValueAction } from '../SelectLabelValueAction';
import { SelectLabelAction, SelectLabelActionState } from './actions/SelectLabelAction';
import { SelectProfileMetricAction, SelectProfileMetricActionState } from './actions/SelectProfileMetricAction';
import { getProfileMetricLabelsQueryRunner } from './data/getProfileMetricLabelsQueryRunner';
import { getProfileQueryRunner } from './data/getProfileQueryRunner';
import { ServiceNameVariable } from './variables/ServiceNameVariable';

const GRID_TEMPLATE_COLUMNS = 'repeat(auto-fit, minmax(400px, 1fr))';
const GRID_AUTO_ROWS = '260px';

export class ProfilesExplorer extends EmbeddedScene {
  constructor(timeRange: TimeRange, services: Services) {
    const storage = userStorage.get(userStorage.KEYS.PROFILES_EXPLORER);
    const pinnedProfileMetrics = storage?.pinnedProfileMetrics || [];
    // const pinnedServices = storage?.pinnedServices || [];

    const children = getProfileMetricOptions(services)
      .sort((a, b) => {
        if (pinnedProfileMetrics.includes(a.value)) {
          return -1;
        }
        if (pinnedProfileMetrics.includes(b.value)) {
          return +1;
        }
        return 0;
      })
      .map(
        (profileMetric, i) =>
          new SceneCSSGridItem({
            body: PanelBuilders.timeseries()
              .setTitle(profileMetric.label)
              .setOption('legend', { showLegend: false }) // hide profile metric
              .setData(getProfileQueryRunner(profileMetric.value))
              .setColor({ mode: 'fixed', fixedColor: getColorByIndex(i) })
              .setCustomFieldConfig('fillOpacity', 9)
              .setHeaderActions([
                new PinServiceAction({ key: 'pinnedProfileMetrics', value: profileMetric.value }),
                new SelectProfileMetricAction({ profileMetric }),
              ])
              .build(),
          })
      );

    const serviceMetric = new ServiceNameVariable({
      name: 'serviceName',
      label: '💡 Service',
      isMulti: false,
      options: getServiceOptions(services),
      // value: pinnedServices[0],
    });

    super({
      $timeRange: new SceneTimeRange({ value: timeRange }),
      $variables: new SceneVariableSet({
        variables: [serviceMetric],
      }),
      controls: [
        new VariableValueSelectors({}),
        new SceneTimePicker({ isOnCanvas: true }),
        new SceneRefreshPicker({ isOnCanvas: true }),
      ],
      body: new SceneCSSGridLayout({
        templateColumns: GRID_TEMPLATE_COLUMNS,
        autoRows: GRID_AUTO_ROWS,
        isLazy: true,
        children,
        $behaviors: [new behaviors.CursorSync({ key: 'metricCrosshairSync', sync: DashboardCursorSync.Crosshair })],
      }),
    });
  }

  async selectProfileMetric({ profileMetric }: SelectProfileMetricActionState) {
    const serviceName = this.state.$variables!.getByName('serviceName')!.getValue() as string;
    const query = `${profileMetric.value}{service_name="${serviceName}"}`;

    const timeRange = this.state.$timeRange!.state.value;
    const from = timeRange.from.unix() * 1000;
    const to = timeRange.to.unix() * 1000;

    const labelsData = await fetchLabelsData(query, from, to);

    const children = labelsData.map(({ id, values }, i) => {
      const gotoSingleViewAction =
        values.length === 1
          ? new SelectLabelValueAction({ profileMetric, serviceName, labelId: id, labelValue: values[0], from, to })
          : null;

      return new SceneCSSGridItem({
        body: PanelBuilders.timeseries()
          .setTitle(`${profileMetric.label} · ${id}`)
          .setOption('legend', { showLegend: true })
          .setData(getProfileMetricLabelsQueryRunner(profileMetric.value, id, values))
          .setColor({ mode: 'fixed', fixedColor: getColorByIndex(i + 1) })
          .setOverrides((overrides) => {
            values.forEach((value, j) => {
              overrides
                .matchFieldsByQuery(value)
                .overrideColor({
                  mode: 'fixed',
                  fixedColor: getColorByIndex(i + j),
                })
                .overrideDisplayName(value);
            });
          })
          .setCustomFieldConfig('fillOpacity', 9)
          .setHeaderActions([
            new PinServiceAction({ key: 'pinnedLabels', value: id }),
            gotoSingleViewAction || new SelectLabelAction({ profileMetric, labelId: id, labelValues: values }),
          ])
          .build(),
      });
    });

    this.setState({
      body: new SceneCSSGridLayout({
        templateColumns: GRID_TEMPLATE_COLUMNS,
        autoRows: GRID_AUTO_ROWS,
        isLazy: true,
        children,
        $behaviors: [new behaviors.CursorSync({ key: 'metricCrosshairSync', sync: DashboardCursorSync.Crosshair })],
      }),
    });
  }

  async selectLabel({ profileMetric, labelId, labelValues }: SelectLabelActionState) {
    const serviceName = this.state.$variables!.getByName('serviceName')!.getValue() as string;
    const timeRange = this.state.$timeRange!.state.value;
    const from = timeRange.from.unix() * 1000;
    const to = timeRange.to.unix() * 1000;

    const children = labelValues.map((value, i) => {
      const labelSelector = `${labelId}="${value}"`;

      return new SceneCSSGridItem({
        body: PanelBuilders.timeseries()
          .setTitle(`${profileMetric.label} · ${labelId} · ${value}`)
          .setOption('legend', { showLegend: true })
          .setData(getProfileQueryRunner(profileMetric.value, labelSelector))
          .setColor({ mode: 'fixed', fixedColor: getColorByIndex(i + 1) })
          .setOverrides((overrides) => {
            overrides
              .matchFieldsByQuery(`${profileMetric.value}-${labelSelector}`)
              .overrideColor({
                mode: 'fixed',
                fixedColor: getColorByIndex(i),
              })
              .overrideDisplayName(value);
          })
          .setCustomFieldConfig('fillOpacity', 9)
          .setHeaderActions(
            new SelectLabelValueAction({
              profileMetric: profileMetric.value,
              serviceName,
              labelId,
              labelValue: value,
              from,
              to,
            })
          )
          .build(),
      });
    });

    this.setState({
      body: new SceneCSSGridLayout({
        templateColumns: GRID_TEMPLATE_COLUMNS,
        autoRows: GRID_AUTO_ROWS,
        isLazy: true,
        children,
        $behaviors: [new behaviors.CursorSync({ key: 'metricCrosshairSync', sync: DashboardCursorSync.Crosshair })],
      }),
    });
  }
}
