import { prefixRouteWithPluginBaseUrl } from '@shared/domain/prefixRouteWithPluginBaseUrl';
import React from 'react';
import { Redirect, Route, Switch } from 'react-router-dom';

import { ROUTES } from '../../../constants';
import { AdHocView } from '../../../pages/AdHocView/AdHocView';
import { ComparisonView } from '../../../pages/ComparisonView/ComparisonView';
import { SettingsView } from '../../../pages/SettingsView/SettingsView';
import { SingleView } from '../../../pages/SingleView/SingleView';
import { TagExplorerView } from '../../../pages/TagExplorer/TagExplorer';
import { useNavigationLinksUpdate } from './domain/useNavigationLinksUpdate';

export function Routes() {
  useNavigationLinksUpdate();

  return (
    <Switch>
      <Route path={prefixRouteWithPluginBaseUrl(ROUTES.EXPLORE_VIEW)} exact>
        <TagExplorerView />
      </Route>
      <Route path={prefixRouteWithPluginBaseUrl(ROUTES.SINGLE_VIEW)} exact>
        <SingleView />
      </Route>
      <Route path={prefixRouteWithPluginBaseUrl(ROUTES.COMPARISON_VIEW)} exact>
        <ComparisonView diff={false} />
      </Route>
      <Route path={prefixRouteWithPluginBaseUrl(ROUTES.COMPARISON_DIFF_VIEW)} exact>
        <ComparisonView diff={true} />
      </Route>
      <Route path={prefixRouteWithPluginBaseUrl(ROUTES.ADHOC_VIEW)} exact>
        <AdHocView />
      </Route>
      <Route path={prefixRouteWithPluginBaseUrl(ROUTES.SETTINGS)} exact>
        <SettingsView />
      </Route>
      {/* Default Route */}
      <Route>
        <Redirect to={prefixRouteWithPluginBaseUrl(ROUTES.EXPLORE_VIEW)} />
      </Route>
    </Switch>
  );
}
