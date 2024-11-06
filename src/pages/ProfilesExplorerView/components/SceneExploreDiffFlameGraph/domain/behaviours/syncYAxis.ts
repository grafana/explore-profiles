import { sceneGraph, SceneObject, SceneObjectState, VizPanel } from '@grafana/scenes';
import { logger } from '@shared/infrastructure/tracking/logger';
import { cloneDeep, merge } from 'lodash';

import { EventTimeseriesDataReceived } from '../../../../domain/events/EventTimeseriesDataReceived';

export function syncYAxis() {
  return (vizPanel: SceneObject<SceneObjectState>) => {
    const maxima = new Map<string, number>();

    const eventSub = vizPanel.subscribeToEvent(EventTimeseriesDataReceived, (event) => {
      const s = event.payload.series?.[0];
      const refId = s?.refId;

      if (!refId) {
        logger.warn('Missing refId! Cannot sync y-axis on the timeseries.', event.payload.series);
        return;
      }

      maxima.set(s.refId as string, Math.max(...s.fields[1].values));

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
