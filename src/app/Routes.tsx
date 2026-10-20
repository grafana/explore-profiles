import React from 'react';
import { Navigate, Routes as ReactRouterRoutes, Route } from 'react-router-dom';

import { PLUGIN_BASE_URL, ROUTES } from '../constants';
import AdHocView from '../pages/AdHocView/AdHocView';
import GitHubCallback from '../pages/ProfilesExplorerView/components/SceneExploreServiceFlameGraph/components/SceneFunctionDetailsPanel/ui/GitHubCallbackView';
import ProfilesExplorerView from '../pages/ProfilesExplorerView/ProfilesExplorerView';
import RecordingRulesView from '../pages/RecordingRulesView/RecordingRulesView';
import SettingsView from '../pages/SettingsView/SettingsView';
import { WithDataSourceUid } from './WithDataSourceUid';

export function Routes() {
  return (
    <ReactRouterRoutes>
      <Route
        path={ROUTES.EXPLORE}
        element={
          <WithDataSourceUid key="ProfilesExplorerView">
            <ProfilesExplorerView />
          </WithDataSourceUid>
        }
      />
      <Route
        path={ROUTES.ADHOC}
        element={
          <WithDataSourceUid key="AdHocView">
            <AdHocView />
          </WithDataSourceUid>
        }
      />
      <Route
        path={ROUTES.SETTINGS}
        element={
          <WithDataSourceUid key="SettingsView">
            <SettingsView />
          </WithDataSourceUid>
        }
      />
      <Route
        path={ROUTES.RECORDING_RULES}
        element={
          <WithDataSourceUid key="RecordingRulesView">
            <RecordingRulesView />
          </WithDataSourceUid>
        }
      />
      <Route path={ROUTES.GITHUB_CALLBACK} element={<GitHubCallback />} />
      {/* Default Route */}
      <Route path="/*" element={<Navigate to={`${PLUGIN_BASE_URL}${ROUTES.EXPLORE}`} replace />} />
    </ReactRouterRoutes>
  );
}
