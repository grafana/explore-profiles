import { PanelType } from '../components/SceneByVariableRepeaterGrid/components/ScenePanelTypeSwitcher';
import { SceneLabelValuesBarGauge } from '../components/SceneLabelValuesBarGauge';
import { SceneLabelValuesHistogram } from '../components/SceneLabelValuesHistogram';
import { SceneLabelValuesTimeseries } from '../components/SceneLabelValuesTimeseries';

export function panelBuilder(panelType: PanelType, options: any) {
  switch (panelType) {
    case PanelType.BARGAUGE:
      return new SceneLabelValuesBarGauge(options);

    case PanelType.HISTOGRAM:
      return new SceneLabelValuesHistogram(options);

    case PanelType.TIMESERIES:
    default:
      return new SceneLabelValuesTimeseries(options);
  }
}
