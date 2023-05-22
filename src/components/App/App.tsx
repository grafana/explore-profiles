import * as React from 'react';
import { AppRootProps } from '@grafana/data';
import { Route, Switch } from 'react-router-dom';
import '../../styles/styles.scss';
import ContinuousSingleView from '@webapp/pages/ContinuousSingleView';
import ContinuousDiffView from '@webapp/pages/ContinuousDiffView';
import ContinuousComparisonView from '@webapp/pages/ContinuousComparisonView';
import { LoadAppNames } from '../LoadAppNames';
import { Provider } from 'react-redux';
import store from '@phlare/redux/store';
import { PLUGIN_BASE_URL, ROUTES } from '../../constants';
import { useTheme2 } from '@grafana/ui';

// Prefixes the route with the base URL of the plugin
export function prefixRoute(route: ROUTES): string {
  return `${PLUGIN_BASE_URL}/${route}`.replace(/\/{2,}/g, '/');
}

// Module augmentation so that typescript sees our 'custom' element
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace JSX {
    interface IntrinsicElements {
      'pyroscope-app': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>;
    }
  }
}

export function App(props: AppRootProps) {
  const theme = useTheme2();
  return (
    <Provider store={store}>
      <pyroscope-app className="app" data-theme={theme.name.toLowerCase()}>
        <div className="pyroscope-app">
          <LoadAppNames>
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
          </LoadAppNames>
        </div>
      </pyroscope-app>
    </Provider>
  );
}
