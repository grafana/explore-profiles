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

import { FavAction } from '../FavAction';
import { getColorByIndex } from '../getColorByIndex';
import { getProfileMetricOptions } from '../getProfileMetricOptions';
import { getServiceOptions } from '../getServiceOptions';
import { SelectProfileMetricAction } from './actions/SelectProfileMetricAction';
import { getProfileMetricQueryRunner } from './data/getProfileMetricQueryRunner';
import { SceneProfileDetails } from './SceneProfileDetails';
import { ServiceNameVariable } from './variables/ServiceNameVariable';

const GRID_TEMPLATE_COLUMNS = 'repeat(auto-fit, minmax(400px, 1fr))';
const GRID_AUTO_ROWS = '240px';

export class SceneProfiles extends EmbeddedScene {
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
              .setData(getProfileMetricQueryRunner({ profileMetricId: profileMetric.value }))
              .setColor({ mode: 'fixed', fixedColor: getColorByIndex(i) })
              .setCustomFieldConfig('fillOpacity', 9)
              .setHeaderActions([
                new SelectProfileMetricAction({ profileMetric }),
                new FavAction({ key: 'pinnedProfileMetrics', value: profileMetric.value }),
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
        $behaviors: [new behaviors.CursorSync({ key: 'metricCrosshairSync', sync: DashboardCursorSync.Crosshair })],
        children,
      }),
    });
  }

  selectProfileMetric(profileMetric: { value: string; label: string }, color: string) {
    this.setState({
      body: new SceneProfileDetails({ profileMetric, color }),
    });
  }
}
