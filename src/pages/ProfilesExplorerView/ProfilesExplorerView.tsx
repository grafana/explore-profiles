import { PageTitle } from '@shared/ui/PageTitle';
import React from 'react';

import { SceneProfilesExplorer } from './SceneProfilesExplorer';

const sceneProfilesExplorer = new SceneProfilesExplorer();

export function ProfilesExplorerView() {
  return (
    <>
      <PageTitle title="Profiles explorer" />
      {<sceneProfilesExplorer.Component model={sceneProfilesExplorer} />}
    </>
  );
}
