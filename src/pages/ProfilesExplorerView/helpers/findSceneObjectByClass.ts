import { sceneGraph, SceneObject } from '@grafana/scenes';

export function findSceneObjectByClass(sceneObject: SceneObject, Class: Function): SceneObject {
  const variable = sceneGraph.findObject(sceneObject, (o) => o instanceof Class);

  if (!variable) {
    throw `Unable to find any scene object for class "${Class}"!`;
  }

  return variable;
}
