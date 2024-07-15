import { sceneGraph, SceneObject } from '@grafana/scenes';

export function findSceneObjectByClass(sceneObject: SceneObject, Class: Function): SceneObject {
  const objectFound = sceneGraph.findObject(sceneObject, (o) => o instanceof Class);

  if (!objectFound) {
    const error = new Error(`Unable to find any scene object for class "${Class.name}"!`);
    console.error(error);
    throw error;
  }

  return objectFound;
}
