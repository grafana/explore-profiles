import { PageTitle } from '@shared/ui/PageTitle';
import React, { useMemo } from 'react';

import { SceneProfilesExplorer } from './SceneProfilesExplorer';

export function ProfilesExplorerView() {
  const sceneProfilesExplorer = useMemo(() => new SceneProfilesExplorer(), []);

  return (
    <>
      <PageTitle title="Profiles explorer" />
      {<sceneProfilesExplorer.Component model={sceneProfilesExplorer} />}
    </>
  );
}
