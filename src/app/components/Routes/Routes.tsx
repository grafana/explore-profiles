import React from 'react';
import { Routes as ReactRouterRoutes, Route } from 'react-router-dom';

import { ROUTES } from '../../../constants';
import { useNavigationLinksUpdate } from './domain/useNavigationLinksUpdate';

const ProfilesExplorerView = React.lazy(() => import('../../../pages/ProfilesExplorerView/ProfilesExplorerView'));
const AdHocView = React.lazy(() => import('../../../pages/AdHocView/AdHocView'));
const SettingsView = React.lazy(() => import('../../../pages/SettingsView/SettingsView'));
const MetricsView = React.lazy(() => import('../../../pages/MetricsView/MetricsView'));

export function Routes() {
  useNavigationLinksUpdate();

  return (
    <ReactRouterRoutes>
      <Route path={`${ROUTES.PROFILES_EXPLORER_VIEW}/*`} element={<ProfilesExplorerView />} />
      <Route path={`${ROUTES.ADHOC_VIEW}/*`} element={<AdHocView />} />
      <Route path={`${ROUTES.SETTINGS}/*`} element={<SettingsView />} />
      <Route path={`${ROUTES.METRICS_VIEW}/*`} element={<MetricsView />} />
      {/* Default Route */}
      <Route path="/*" element={<ProfilesExplorerView />} />
    </ReactRouterRoutes>
  );
}
