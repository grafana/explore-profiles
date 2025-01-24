import React from 'react';
import { Routes as ReactRouterRoutes, Route } from 'react-router-dom';
import { MetricsView } from 'src/pages/MetricsView/MetricsView';

import { ROUTES } from '../../../constants';
import { AdHocView } from '../../../pages/AdHocView/AdHocView';
import { ProfilesExplorerView } from '../../../pages/ProfilesExplorerView/ProfilesExplorerView';
import { SettingsView } from '../../../pages/SettingsView/SettingsView';
import { useNavigationLinksUpdate } from './domain/useNavigationLinksUpdate';

export function Routes() {
  useNavigationLinksUpdate();

  return (
    <ReactRouterRoutes>
      <Route path={ROUTES.PROFILES_EXPLORER_VIEW} element={<ProfilesExplorerView />} />
      <Route path={ROUTES.ADHOC_VIEW} element={<AdHocView />} />
      <Route path={ROUTES.SETTINGS} element={<SettingsView />} />
      <Route path={ROUTES.METRICS_VIEW} element={<MetricsView />} />
      {/* Default Route */}
      <Route path="/*" element={<ProfilesExplorerView />} />
    </ReactRouterRoutes>
  );
}
