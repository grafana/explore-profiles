import { getUrlSyncManager } from '@grafana/scenes';
import { PageTitle } from '@shared/ui/PageTitle';
import React, { useEffect, useMemo, useState } from 'react';

import { SceneProfilesExplorer } from './SceneProfilesExplorer';

export function ProfilesExplorerView() {
  const [isInitialized, setIsInitialized] = useState(false);
  const sceneProfilesExplorer = useMemo(() => new SceneProfilesExplorer(), []);

  useEffect(() => {
    if (!isInitialized) {
      getUrlSyncManager().initSync(sceneProfilesExplorer);
      setIsInitialized(true);
    }
  }, [sceneProfilesExplorer, isInitialized]);

  return (
    <>
      <PageTitle title="Profiles explorer" />
      {isInitialized && <sceneProfilesExplorer.Component model={sceneProfilesExplorer} />}
    </>
  );
}
