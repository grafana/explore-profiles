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

import { getColorByIndex } from '../getColorByIndex';
import { getProfileMetricOptions } from '../getProfileMetricOptions';
import { getServiceOptions } from '../getServiceOptions';
import { PinServiceAction } from '../PinServiceAction';
import { SelectServiceAction } from './actions/SelectServiceAction';
import { getServiceQueryRunner } from './data/getServiceQueryRunner';
import { SceneServiceDetails } from './SceneServiceDetails';
import { ProfileMetricVariable } from './variables/ProfileMetricVariable';

const GRID_TEMPLATE_COLUMNS = 'repeat(auto-fit, minmax(400px, 1fr))';
const GRID_AUTO_ROWS = '240px';

export class SceneServices extends EmbeddedScene {
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
                new SelectServiceAction({ serviceName: service.value }),
                new PinServiceAction({ key: 'pinnedServices', value: service.value }),
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
        $behaviors: [new behaviors.CursorSync({ key: 'metricCrosshairSync', sync: DashboardCursorSync.Crosshair })],
        children,
      }),
    });
  }

  selectService(serviceName: string, color: string) {
    this.setState({
      body: new SceneServiceDetails({ serviceName, color }),
    });
  }
}
