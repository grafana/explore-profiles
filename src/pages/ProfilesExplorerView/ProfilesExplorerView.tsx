import React, { useMemo } from 'react';

import { SceneProfilesExplorer } from './SceneProfilesExplorer/SceneProfilesExplorer';

export function ProfilesExplorerView() {
  const sceneProfilesExplorer = useMemo(() => new SceneProfilesExplorer(), []);

  return <sceneProfilesExplorer.Component model={sceneProfilesExplorer} />;
}
