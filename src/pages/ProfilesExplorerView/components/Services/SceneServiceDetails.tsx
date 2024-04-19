import {
  PanelBuilders,
  SceneFlexItem,
  SceneFlexLayout,
  SceneObjectState,
  VariableDependencyConfig,
} from '@grafana/scenes';

import { getServiceQueryRunner } from './data/getServiceQueryRunner';
import { SceneServiceDetailsTabs } from './SceneServiceDetailsTabs';

const MIN_HEIGHT_TIMESERIES = 240;

interface SceneServiceDetailsState extends SceneObjectState {
  serviceName: string;
  color: string;
}

export class SceneServiceDetails extends SceneFlexLayout {
  protected _variableDependency = new VariableDependencyConfig(this, {
    variableNames: ['profileMetric'],
  });

  constructor(state: SceneServiceDetailsState) {
    const { serviceName, color } = state;

    super({
      direction: 'column',
      minHeight: MIN_HEIGHT_TIMESERIES,
      children: [
        new SceneFlexItem({
          body: PanelBuilders.timeseries()
            .setTitle(serviceName)
            .setOption('legend', { showLegend: true })
            .setData(getServiceQueryRunner(serviceName))
            .setColor({ mode: 'fixed', fixedColor: color })
            .setCustomFieldConfig('fillOpacity', 9)
            .build(),
        }),
        new SceneFlexItem({
          body: new SceneServiceDetailsTabs({
            serviceName,
            activeTabId: 'breakdown',
          }),
        }),
      ],
    });
  }
}
