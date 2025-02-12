import { useReportPageInitialized } from '@shared/infrastructure/tracking/useReportPageInitialized';
import React, { useMemo } from 'react';

import { SceneProfilesExplorer } from './components/SceneProfilesExplorer/SceneProfilesExplorer';

export default function ProfilesExplorerView() {
  const sceneProfilesExplorer = useMemo(() => new SceneProfilesExplorer(), []);
  useReportPageInitialized('explore');

  return <sceneProfilesExplorer.Component model={sceneProfilesExplorer} />;
}
