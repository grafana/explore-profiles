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
import { SelectServiceAction, SelectServiceActionState } from './actions/SelectServiceAction';
import { getServiceLabelsQueryRunner } from './data/getServiceLabelsQueryRunner';
import { getServiceQueryRunner } from './data/getServiceQueryRunner';
import { ProfileMetricVariable } from './variables/ProfileMetricVariable';

const GRID_TEMPLATE_COLUMNS = 'repeat(auto-fit, minmax(400px, 1fr))';
const GRID_AUTO_ROWS = '260px';

export class ServicesExplorer extends EmbeddedScene {
  constructor(timeRange: TimeRange, services: Services) {
    const storage = userStorage.get(userStorage.KEYS.PROFILES_EXPLORER);
    const pinnedServices = storage?.pinnedServices || [];
    // const pinnedProfileMetrics = storage?.pinnedProfileMetrics || [];

    const children = getServiceOptions(services)
      .sort((a, b) => {
        if (pinnedServices.includes(a.value)) {
          return -1;
        }
        if (pinnedServices.includes(b.value)) {
          return +1;
        }
        return 0;
      })
      .map(
        (service, i) =>
          new SceneCSSGridItem({
            body: PanelBuilders.timeseries()
              .setTitle(service.value)
              .setOption('legend', { showLegend: false }) // hide profile metric ("cpu", etc.)
              .setData(getServiceQueryRunner(service.value))
              .setColor({ mode: 'fixed', fixedColor: getColorByIndex(i) })
              .setCustomFieldConfig('fillOpacity', 9)
              .setHeaderActions([
                new PinServiceAction({ key: 'pinnedServices', value: service.value }),
                new SelectServiceAction({ serviceName: service.value }),
              ])
              .build(),
          })
      );

    const profileMetric = new ProfileMetricVariable({
      name: 'profileMetric',
      label: '🔥 Profile',
      isMulti: false,
      options: getProfileMetricOptions(services),
      value: 'process_cpu:cpu:nanoseconds:cpu:nanoseconds',
      // value: pinnedProfileMetrics[0],
    });

    super({
      $timeRange: new SceneTimeRange({ value: timeRange }),
      $variables: new SceneVariableSet({
        variables: [profileMetric],
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

  async selectService({ serviceName }: SelectServiceActionState) {
    const profileMetric = this.state.$variables!.getByName('profileMetric')!.getValue() as string;
    const query = `${profileMetric}{service_name="${serviceName}"}`;

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
          .setTitle(`${serviceName} · ${id}`)
          .setOption('legend', { showLegend: true })
          .setData(getServiceLabelsQueryRunner(serviceName, id, values))
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
            gotoSingleViewAction || new SelectLabelAction({ serviceName, labelId: id, labelValues: values }),
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

  async selectLabel({ serviceName, labelId, labelValues }: SelectLabelActionState) {
    const profileMetric = this.state.$variables!.getByName('profileMetric')!.getValue() as string;
    const timeRange = this.state.$timeRange!.state.value;
    const from = timeRange.from.unix() * 1000;
    const to = timeRange.to.unix() * 1000;

    const children = labelValues.map((value, i) => {
      const labelSelector = `${labelId}="${value}"`;

      return new SceneCSSGridItem({
        body: PanelBuilders.timeseries()
          .setTitle(`${serviceName} · ${labelId} · ${value}`)
          .setOption('legend', { showLegend: true })
          .setData(getServiceQueryRunner(serviceName, labelSelector))
          .setColor({ mode: 'fixed', fixedColor: getColorByIndex(i + 1) })
          .setOverrides((overrides) => {
            overrides
              .matchFieldsByQuery(`${serviceName}-${labelSelector}`)
              .overrideColor({
                mode: 'fixed',
                fixedColor: getColorByIndex(i),
              })
              .overrideDisplayName(value);
          })
          .setCustomFieldConfig('fillOpacity', 9)
          .setHeaderActions(
            new SelectLabelValueAction({ profileMetric, serviceName, labelId, labelValue: value, from, to })
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
