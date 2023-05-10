import * as React from 'react';
import { AppRootProps } from '@grafana/data';
import { Route, Switch } from 'react-router-dom';
import '@webapp/../sass/profile.scss';
import ContinuousSingleView from '@webapp/pages/ContinuousSingleView';
import ContinuousDiffView from '@webapp/pages/ContinuousDiffView';
import ContinuousComparisonView from '@webapp/pages/ContinuousComparisonView';
import { Provider } from 'react-redux';
import store from '@phlare/redux/store';
import { PLUGIN_BASE_URL, ROUTES } from '../../constants';

// Prefixes the route with the base URL of the plugin
export function prefixRoute(route: ROUTES): string {
  return `${PLUGIN_BASE_URL}/${route}`.replace(/\/{2,}/g, '/');
}

export function App(props: AppRootProps) {
  return (
    <Provider store={store}>
      <div className="app">
        <div className="pyroscope-app">
          <Switch>
            <Route path={prefixRoute(ROUTES.COMPARISON_DIFF_VIEW)}>
              <ContinuousDiffView />
            </Route>
            <Route path={prefixRoute(ROUTES.COMPARISON_VIEW)}>
              <ContinuousComparisonView />
            </Route>
            {/* Default Page */}
            <Route>
              <ContinuousSingleView />
            </Route>
          </Switch>
        </div>
      </div>
    </Provider>
  );
}
