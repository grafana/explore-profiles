import { sceneGraph, SceneObject, SceneObjectState, VizPanel } from '@grafana/scenes';
import { cloneDeep, merge } from 'lodash';

import { EventTimeseriesDataReceived } from '../../../../domain/events/EventTimeseriesDataReceived';

export function syncYAxis() {
  return (vizPanel: SceneObject<SceneObjectState>) => {
    const maxima = new Map<string, number>();

    const eventSub = vizPanel.subscribeToEvent(EventTimeseriesDataReceived, (event) => {
      const { series } = event.payload;
      const refId = series[0]?.refId;

      if (!refId) {
        console.warn('Missing refId! Cannot sync y-axis on the timeseries.', series);
        return;
      }

      maxima.set(series[0].refId as string, Math.max(...series[0].fields[1].values));

      updateTimeseriesAxis(vizPanel, Math.max(...maxima.values()));
    });

    return () => {
      eventSub.unsubscribe();
    };
  };
}

function updateTimeseriesAxis(vizPanel: SceneObject, max: number) {
  // findAllObjects searches down the full scene graph
  const timeseries = sceneGraph.findAllObjects(
    vizPanel,
    (o) => o instanceof VizPanel && o.state.pluginId === 'timeseries'
  ) as VizPanel[];

  for (const t of timeseries) {
    t.clearFieldConfigCache(); // required

    t.setState({
      fieldConfig: merge(cloneDeep(t.state.fieldConfig), { defaults: { max } }),
    });
  }
}
