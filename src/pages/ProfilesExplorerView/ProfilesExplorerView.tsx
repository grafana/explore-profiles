import React, { useMemo } from 'react';

import { SceneProfilesExplorer } from './components/SceneProfilesExplorer/SceneProfilesExplorer';

export function ProfilesExplorerView() {
  const sceneProfilesExplorer = useMemo(() => new SceneProfilesExplorer(), []);

  return <sceneProfilesExplorer.Component model={sceneProfilesExplorer} />;
}
