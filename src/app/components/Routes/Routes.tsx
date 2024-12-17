import { prefixRouteWithPluginBaseUrl } from '@shared/domain/prefixRouteWithPluginBaseUrl';
import React from 'react';
import { Routes as ReactRouterRoutes, Route } from 'react-router-dom';

import { ROUTES } from '../../../constants';
import { AdHocView } from '../../../pages/AdHocView/AdHocView';
import { ProfilesExplorerView } from '../../../pages/ProfilesExplorerView/ProfilesExplorerView';
import { SettingsView } from '../../../pages/SettingsView/SettingsView';
import { useNavigationLinksUpdate } from './domain/useNavigationLinksUpdate';

export function Routes() {
  useNavigationLinksUpdate();

  return (
    <ReactRouterRoutes>
      <Route path={prefixRouteWithPluginBaseUrl(ROUTES.PROFILES_EXPLORER_VIEW)} element={<ProfilesExplorerView />} />
      <Route path={prefixRouteWithPluginBaseUrl(ROUTES.ADHOC_VIEW)} element={<AdHocView />} />
      <Route path={prefixRouteWithPluginBaseUrl(ROUTES.SETTINGS)} element={<SettingsView />} />
      {/* Default Route */}
      <Route path={prefixRouteWithPluginBaseUrl('/*')} element={<ProfilesExplorerView />} />
    </ReactRouterRoutes>
  );
}
