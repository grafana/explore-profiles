import {
  PanelBuilders,
  SceneFlexItem,
  SceneFlexLayout,
  SceneObjectState,
  VariableDependencyConfig,
} from '@grafana/scenes';

import { getProfileMetricQueryRunner } from './data/getProfileMetricQueryRunner';
import { SceneProfileMetricDetailsTabs } from './SceneProfileMetricDetailsTabs';

const MIN_HEIGHT_TIMESERIES = 240;

interface SceneProfileDetailsState extends SceneObjectState {
  profileMetric: { label: string; value: string };
  color: string;
}

export class SceneProfileDetails extends SceneFlexLayout {
  protected _variableDependency = new VariableDependencyConfig(this, {
    variableNames: ['profileMetric'],
  });

  constructor(state: SceneProfileDetailsState) {
    const { profileMetric, color } = state;

    super({
      direction: 'column',
      minHeight: MIN_HEIGHT_TIMESERIES,
      children: [
        new SceneFlexItem({
          body: PanelBuilders.timeseries()
            .setTitle(profileMetric.label)
            .setOption('legend', { showLegend: true })
            .setData(getProfileMetricQueryRunner(profileMetric.value))
            .setColor({ mode: 'fixed', fixedColor: color })
            .setCustomFieldConfig('fillOpacity', 9)
            .build(),
        }),
        new SceneFlexItem({
          body: new SceneProfileMetricDetailsTabs({
            profileMetric,
            activeTabId: 'breakdown',
          }),
        }),
      ],
    });
  }
}
