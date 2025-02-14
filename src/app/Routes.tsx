import React from 'react';
import { Routes as ReactRouterRoutes, Route } from 'react-router-dom';

import { ROUTES } from '../constants';
import AdHocView from '../pages/AdHocView/AdHocView';
import ProfilesExplorerView from '../pages/ProfilesExplorerView/ProfilesExplorerView';
import SettingsView from '../pages/SettingsView/SettingsView';

export function Routes() {
  return (
    <ReactRouterRoutes>
      <Route path={ROUTES.EXPLORE} element={<ProfilesExplorerView />} />
      <Route path={ROUTES.ADHOC} element={<AdHocView />} />
      <Route path={ROUTES.SETTINGS} element={<SettingsView />} />
      {/* Default Route */}
      <Route path="/*" element={<ProfilesExplorerView />} />
    </ReactRouterRoutes>
  );
}
