import React from 'react';
import { Routes as ReactRouterRoutes, Route } from 'react-router-dom';

import { ROUTES } from '../../../constants';
import { AdHocView } from '../../../pages/AdHocView/AdHocView';
import { ProfilesExplorerView } from '../../../pages/ProfilesExplorerView/ProfilesExplorerView';
import { SettingsView } from '../../../pages/SettingsView/SettingsView';
import { useNavigationLinksUpdate } from './domain/useNavigationLinksUpdate';

// const PageOne = React.lazy(() => import('../../pages/PageOne'));
// const PageTwo = React.lazy(() => import('../../pages/PageTwo'));
// const PageThree = React.lazy(() => import('../../pages/PageThree'));
// const PageFour = React.lazy(() => import('../../pages/PageFour'));

export function Routes() {
  useNavigationLinksUpdate();

  return (
    <ReactRouterRoutes>
      <Route path={ROUTES.PROFILES_EXPLORER_VIEW} element={<ProfilesExplorerView />} />
      <Route path={ROUTES.ADHOC_VIEW} element={<AdHocView />} />
      <Route path={ROUTES.SETTINGS} element={<SettingsView />} />
      {/* Default Route */}
      <Route path="/*" element={<ProfilesExplorerView />} />
    </ReactRouterRoutes>
  );
}
