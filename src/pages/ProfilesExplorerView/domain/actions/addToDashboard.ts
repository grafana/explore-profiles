import { BusEventWithPayload, type TimeRange } from '@grafana/data';
import { sceneGraph, SceneQueryRunner, type VizPanel } from '@grafana/scenes';
import { type Panel } from '@grafana/schema';

export const ADD_TO_DASHBOARD_COMPONENT_ID = 'grafana/add-to-dashboard-form/v1';

export interface PanelDataRequestPayload {
  panel: Panel;
  range: TimeRange;
}

export interface EventOpenAddToDashboardPayload {
  panelData: PanelDataRequestPayload;
}

export class EventOpenAddToDashboard extends BusEventWithPayload<EventOpenAddToDashboardPayload> {
  public static readonly type = 'open-add-to-dashboard';
}

export interface AddToDashboardFormProps {
  onClose: () => void;
  buildPanel: () => Panel;
  timeRange?: TimeRange;
  options?: { useAbsolutePath: boolean };
}

/** Interpolate string fields on query targets so dashboard panels get resolved filters and variables. */
function interpolateQueryTarget(vizPanel: VizPanel, target: Record<string, unknown>): Record<string, unknown> {
  const next: Record<string, unknown> = { ...target };
  for (const key of Object.keys(next)) {
    const value = next[key];
    if (typeof value === 'string') {
      next[key] = value ? sceneGraph.interpolate(vizPanel, value) : value;
    }
  }
  return next;
}

function queryRunnerToPanelQueryFields(
  vizPanel: VizPanel,
  runner: SceneQueryRunner
): Pick<Panel, 'targets' | 'datasource'> & { maxDataPoints?: number } {
  const targets = (runner.state.queries ?? []).map((q) =>
    interpolateQueryTarget(vizPanel, q as Record<string, unknown>)
  );
  const ds = runner.state.datasource;
  const datasource = ds
    ? {
        ...ds,
        uid: ds.uid ? sceneGraph.interpolate(vizPanel, ds.uid) : ds.uid,
      }
    : ds;
  const maxDataPoints = runner.state.maxDataPoints;

  return { targets, datasource, maxDataPoints };
}

export function getPanelData(vizPanel: VizPanel): PanelDataRequestPayload {
  const range = sceneGraph.getTimeRange(vizPanel).state.value;
  const data = sceneGraph.getData(vizPanel);
  const found = sceneGraph.findObject(data, (o) => o instanceof SceneQueryRunner);

  const fromRunner = found instanceof SceneQueryRunner ? queryRunnerToPanelQueryFields(vizPanel, found) : undefined;

  const vs = vizPanel.state;
  const panel: Panel = {
    type: vs.pluginId,
    title: vs.title ? sceneGraph.interpolate(vizPanel, vs.title) : vs.title,
    targets: fromRunner?.targets ?? [],
    datasource: fromRunner?.datasource,
    options: vs.options,
    fieldConfig: vs.fieldConfig as Panel['fieldConfig'],
    ...(vs.description && { description: vs.description }),
    ...(fromRunner?.maxDataPoints ? { maxDataPoints: fromRunner.maxDataPoints } : {}),
  };

  return { panel, range };
}
