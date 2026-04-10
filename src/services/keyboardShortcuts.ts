import { BusEventBase, rangeUtil, RawTimeRange } from '@grafana/data';
import { getAppEvents } from '@grafana/runtime';
import { sceneGraph, SceneObject, SceneTimePicker } from '@grafana/scenes';

import { SceneProfilesExplorer } from '../pages/ProfilesExplorerView/components/SceneProfilesExplorer/SceneProfilesExplorer';
import { KeybindingSet } from './KeybindingSet';

const appEvents = getAppEvents();

export function setupKeyboardShortcuts(scene: SceneProfilesExplorer) {
  const keybindings = new KeybindingSet();

  // Copy time range
  keybindings.addBinding({
    key: 't c',
    onTrigger: () => {
      const picker = getTimePicker(scene);
      const timeRange = picker ? sceneGraph.getTimeRange(picker) : sceneGraph.getTimeRange(scene);
      const restoreContext = setWindowGrafanaSceneContext(timeRange);
      appEvents.publish(new CopyTimeEvent());
      restoreContext();
    },
  });

  // Paste time range
  keybindings.addBinding({
    key: 't v',
    onTrigger: async () => {
      const copiedRange = await getCopiedTimeRange();
      if (!copiedRange) {
        return;
      }
      const picker = getTimePicker(scene);
      const timeRange = picker ? sceneGraph.getTimeRange(picker) : sceneGraph.getTimeRange(scene);
      const newRange = rangeUtil.convertRawToRange(copiedRange);
      timeRange.setState({
        from: typeof copiedRange.from === 'string' ? copiedRange.from : undefined,
        to: typeof copiedRange.to === 'string' ? copiedRange.to : undefined,
        value: newRange,
      });
    },
  });

  // Refresh
  keybindings.addBinding({
    key: 'd r',
    onTrigger: () => sceneGraph.getTimeRange(scene).onRefresh(),
  });

  // Zoom out
  keybindings.addBinding({
    key: 't z',
    onTrigger: () => getTimePicker(scene)?.onZoom(),
  });

  // Zoom out alias
  keybindings.addBinding({
    key: 'ctrl+z',
    onTrigger: () => getTimePicker(scene)?.onZoom(),
  });

  // Relative -> Absolute time range
  keybindings.addBinding({
    key: 't a',
    onTrigger: () => getTimePicker(scene)?.toAbsolute(),
  });

  // Shift time range left
  keybindings.addBinding({
    key: 't left',
    onTrigger: () => getTimePicker(scene)?.onMoveBackward(),
  });

  // Shift time range right
  keybindings.addBinding({
    key: 't right',
    onTrigger: () => getTimePicker(scene)?.onMoveForward(),
  });

  return () => {
    keybindings.removeAll();
  };
}

let lastInteractedPicker: SceneTimePicker | null = null;

export function setActiveTimePicker(picker: SceneTimePicker) {
  lastInteractedPicker = picker;
}

function getActiveTimePickers(scene: SceneProfilesExplorer): SceneTimePicker[] {
  return sceneGraph.findAllObjects(scene, (o) => o instanceof SceneTimePicker && o.isActive) as SceneTimePicker[];
}

function getTimePicker(scene: SceneProfilesExplorer): SceneTimePicker | undefined {
  if (lastInteractedPicker?.isActive) {
    return lastInteractedPicker;
  }

  return getActiveTimePickers(scene)[0];
}

// Copied from https://github.com/grafana/grafana/blob/main/public/app/types/events.ts
export class CopyTimeEvent extends BusEventBase {
  static type = 'copy-time';
}

async function getCopiedTimeRange(): Promise<RawTimeRange | undefined> {
  try {
    const raw = await navigator.clipboard.readText();
    const parsed = JSON.parse(raw);
    if (
      typeof parsed === 'object' &&
      parsed !== null &&
      'from' in parsed &&
      'to' in parsed &&
      typeof parsed.from === 'string' &&
      typeof parsed.to === 'string'
    ) {
      return { from: parsed.from, to: parsed.to };
    }
  } catch {
    // clipboard empty, not JSON, or no permission
  }
  return undefined;
}

function setWindowGrafanaSceneContext(activeScene: SceneObject) {
  const prevScene = (window as any).__grafanaSceneContext;

  (window as any).__grafanaSceneContext = activeScene;

  return () => {
    if ((window as any).__grafanaSceneContext === activeScene) {
      (window as any).__grafanaSceneContext = prevScene;
    }
  };
}
