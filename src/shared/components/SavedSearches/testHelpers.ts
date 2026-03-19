import { SceneObject } from '@grafana/scenes';

/** Use for mock scene refs and sceneGraph return values to satisfy SceneObject type. */
export function asSceneObject(value: object): SceneObject {
  return value as unknown as SceneObject;
}

export function getSaveSearchMock() {
  return jest.requireMock('./saveSearch') as Record<string, jest.Mock>;
}

export function getUtilsMock() {
  return jest.requireMock('./utils') as Record<string, jest.Mock>;
}
