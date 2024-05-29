import { sceneGraph, SceneObject } from '@grafana/scenes';

export function findSceneObjectByClass(sceneObject: SceneObject, Class: Function): SceneObject {
  const objectFound = sceneGraph.findObject(sceneObject, (o) => o instanceof Class);

  if (!objectFound) {
    throw `Unable to find any scene object for class "${Class}"!`;
  }

  return objectFound;
}
