import { sceneGraph, SceneObject } from '@grafana/scenes';

export function findSceneObjectByKey(sceneObject: SceneObject, key: string): SceneObject {
  const objectFound = sceneGraph.findObject(sceneObject, (o) => o.state.key === key);

  if (!objectFound) {
    const error = new Error(`Unable to find any scene object with key="${key}"!`);
    console.error(error);
    throw error;
  }

  return objectFound;
}
