import { sceneGraph, SceneObject } from '@grafana/scenes';

export function getSceneVariableValue(sceneObject: SceneObject, variableName: string): string {
  return sceneGraph.lookupVariable(variableName, sceneObject)?.getValue() as string;
}
