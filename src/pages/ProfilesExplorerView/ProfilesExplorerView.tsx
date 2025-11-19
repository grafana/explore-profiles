import { UrlSyncContextProvider } from '@grafana/scenes';
import { useReportPageInitialized } from '@shared/infrastructure/tracking/useReportPageInitialized';
import React, { useMemo } from 'react';

import { SceneProfilesExplorer } from './components/SceneProfilesExplorer/SceneProfilesExplorer';

export default function ProfilesExplorerView() {
  const sceneProfilesExplorer = useMemo(() => new SceneProfilesExplorer({}), []);
  useReportPageInitialized('explore');

  return (
    <UrlSyncContextProvider scene={sceneProfilesExplorer} updateUrlOnInit={false} createBrowserHistorySteps={true}>
      <sceneProfilesExplorer.Component model={sceneProfilesExplorer} />
    </UrlSyncContextProvider>
  );
}
