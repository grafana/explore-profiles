import React from 'react';
import { Routes as ReactRouterRoutes, Route } from 'react-router-dom';

import { ROUTES } from '../constants';

const ProfilesExplorerView = React.lazy(() => import('../pages/ProfilesExplorerView/ProfilesExplorerView'));
const AdHocView = React.lazy(() => import('../pages/AdHocView/AdHocView'));
const SettingsView = React.lazy(() => import('../pages/SettingsView/SettingsView'));

export function Routes() {
  return (
    <ReactRouterRoutes>
      <Route path={`${ROUTES.EXPLORE}/*`} element={<ProfilesExplorerView />} />
      <Route path={`${ROUTES.ADHOC}/*`} element={<AdHocView />} />
      <Route path={`${ROUTES.SETTINGS}/*`} element={<SettingsView />} />
      {/* Default Route */}
      <Route path="/*" element={<ProfilesExplorerView />} />
    </ReactRouterRoutes>
  );
}
