import { SceneObject } from '@grafana/scenes';

// ExplorationType.ALL_SERVICES = 'all' — using string literals avoids a circular import
// (SceneProfilesExplorer imports infrastructure files, so infrastructure cannot import SceneProfilesExplorer)
export function getExplorationType(sceneObject: SceneObject): string {
  let current: SceneObject | undefined = sceneObject.parent;
  while (current) {
    if ((current.state as any).key === 'profiles-explorer') {
      return (current.state as any).explorationType || '';
    }
    current = current.parent;
  }
  return '';
}
