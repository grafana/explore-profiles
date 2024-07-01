import { MultiValueVariable, SceneObject } from '@grafana/scenes';

import { findSceneObjectByClass } from './findSceneObjectByClass';

export function getSceneVariableValue(sceneObject: SceneObject, VariableClass: Function): string {
  return (findSceneObjectByClass(sceneObject, VariableClass) as MultiValueVariable).state.value as string;
}
