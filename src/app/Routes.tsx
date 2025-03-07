import React from 'react';
import { Navigate, Routes as ReactRouterRoutes, Route } from 'react-router-dom';

import { PLUGIN_BASE_URL, ROUTES } from '../constants';
import AdHocView from '../pages/AdHocView/AdHocView';
import ProfilesExplorerView from '../pages/ProfilesExplorerView/ProfilesExplorerView';
import SettingsView from '../pages/SettingsView/SettingsView';

const RecordingRulesView = React.lazy(() => import('../pages/RecordingRulesView/RecordingRulesView'));

export function Routes() {
  return (
    <ReactRouterRoutes>
      <Route path={ROUTES.EXPLORE} element={<ProfilesExplorerView />} />
      <Route path={ROUTES.ADHOC} element={<AdHocView />} />
      <Route path={ROUTES.SETTINGS} element={<SettingsView />} />
      <Route path={ROUTES.RECORDING_RULES} element={<RecordingRulesView />} />
      {/* Default Route */}
      <Route path="/*" element={<Navigate to={`${PLUGIN_BASE_URL}${ROUTES.EXPLORE}`} replace />} />
    </ReactRouterRoutes>
  );
}
