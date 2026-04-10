import { BusEventBase, BusEventWithPayload } from '@grafana/data';
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
      const timeRange = sceneGraph.getTimeRange(scene);
      setWindowGrafanaSceneContext(timeRange);
      appEvents.publish(new CopyTimeEvent());
    },
  });

  // Paste time range
  keybindings.addBinding({
    key: 't v',
    onTrigger: () => {
      const event = new PasteTimeEvent({ updateUrl: false });
      scene.publishEvent(event);
      appEvents.publish(event);
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
    onTrigger: () => {
      getTimePicker(scene)?.onZoom();
    },
  });

  // Zoom out alias
  keybindings.addBinding({
    key: 'ctrl+z',
    onTrigger: () => {
      getTimePicker(scene)?.onZoom();
    },
  });

  // Relative -> Absolute time range
  keybindings.addBinding({
    key: 't a',
    onTrigger: () => {
      getTimePicker(scene)?.toAbsolute();
    },
  });

  // Shift time range left
  keybindings.addBinding({
    key: 't left',
    onTrigger: () => {
      getTimePicker(scene)?.onMoveBackward();
    },
  });

  // Shift time range right
  keybindings.addBinding({
    key: 't right',
    onTrigger: () => {
      getTimePicker(scene)?.onMoveForward();
    },
  });

  return () => {
    keybindings.removeAll();
  };
}

function getTimePicker(scene: SceneProfilesExplorer) {
  return scene.state.controls?.find((s) => s instanceof SceneTimePicker) as SceneTimePicker | undefined;
}

// Copied from https://github.com/grafana/grafana/blob/main/public/app/types/events.ts
export class CopyTimeEvent extends BusEventBase {
  static type = 'copy-time';
}

interface PasteTimeEventPayload {
  timeRange?: string;
  updateUrl?: boolean;
}

export class PasteTimeEvent extends BusEventWithPayload<PasteTimeEventPayload> {
  static type = 'paste-time';
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
