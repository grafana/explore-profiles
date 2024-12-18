import { prefixRouteWithPluginBaseUrl } from '@shared/domain/prefixRouteWithPluginBaseUrl';
import React from 'react';
import { Routes as ReactRouterRoutes, Route } from 'react-router-dom';

import { ROUTES } from '../../../constants';
import { useNavigationLinksUpdate } from './domain/useNavigationLinksUpdate';

const ProfilesExplorerView = React.lazy(() => import('../../../pages/ProfilesExplorerView/ProfilesExplorerView'));
const AdHocView = React.lazy(() => import('../../../pages/AdHocView/AdHocView'));
const SettingsView = React.lazy(() => import('../../../pages/SettingsView/SettingsView'));

export function Routes() {
  useNavigationLinksUpdate();

  return (
    <ReactRouterRoutes>
      <Route path={prefixRouteWithPluginBaseUrl(ROUTES.PROFILES_EXPLORER_VIEW)} element={<ProfilesExplorerView />} />
      <Route path={prefixRouteWithPluginBaseUrl(ROUTES.ADHOC_VIEW)} element={<AdHocView />} />
      <Route path={prefixRouteWithPluginBaseUrl(ROUTES.SETTINGS)} element={<SettingsView />} />
      {/* Default Route */}
      <Route path="/*" element={<ProfilesExplorerView />} />
    </ReactRouterRoutes>
  );
}
