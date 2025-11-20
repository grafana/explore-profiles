import { sceneGraph, SceneObject } from '@grafana/scenes';

// When URL sync/context is not initialized yet, interpolation can throw due to missing $variables.
// Fall back to empty strings to avoid hard errors during variable bootstrap.
export function safeInterpolate(sceneObject: SceneObject | undefined, expr: string): string {
  try {
    return sceneGraph.interpolate(sceneObject as any, expr) ?? '';
  } catch {
    return '';
  }
}
