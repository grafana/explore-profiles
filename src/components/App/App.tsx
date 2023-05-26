import * as React from 'react';
import { AppRootProps } from '@grafana/data';
import { Route, Switch, Redirect } from 'react-router-dom';
import '../../styles/styles.scss';
import TagExplorerView from '@webapp/pages/TagExplorerView';
import ContinuousSingleView from '@webapp/pages/ContinuousSingleView';
import ContinuousDiffView from '@webapp/pages/ContinuousDiffView';
import ContinuousComparisonView from '@webapp/pages/ContinuousComparisonView';
import { LoadAppNames } from '../LoadAppNames';
import { Provider } from 'react-redux';
import store from '@phlare/redux/store';
import { ROUTES } from '../../constants';
import { PluginPropsContext } from '../../utils/utils.plugin';
import { useTheme2 } from '@grafana/ui';
import { useNavigation, prefixRoute } from '../../utils/utils.routing';

// Module augmentation so that typescript sees our 'custom' element
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace JSX {
    interface IntrinsicElements {
      'pyroscope-app': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>;
    }
  }
}

function Routes() {
  // This hook needs to be under the PLuginPropsContextProvider
  useNavigation();

  return (
    <LoadAppNames>
      <Switch>
        <Route path={prefixRoute(ROUTES.SINGLE_VIEW)} exact>
          <ContinuousSingleView />
        </Route>
        <Route path={prefixRoute(ROUTES.COMPARISON_DIFF_VIEW)} exact>
          <ContinuousDiffView />
        </Route>
        <Route path={prefixRoute(ROUTES.COMPARISON_VIEW)} exact>
          <ContinuousComparisonView />
        </Route>
        <Route path={prefixRoute(ROUTES.EXPLORE_VIEW)} exact>
          <TagExplorerView />
        </Route>
        {/* Default Route */}
        <Route>
          <Redirect to={prefixRoute(ROUTES.EXPLORE_VIEW)} />
        </Route>
      </Switch>
    </LoadAppNames>
  );
}

export function App(props: AppRootProps) {
  const theme = useTheme2();

  return (
    <PluginPropsContext.Provider value={props}>
      <Provider store={store}>
        <pyroscope-app className="app" data-theme={theme.name.toLowerCase()}>
          <div className="pyroscope-app">
            <Routes />
          </div>
        </pyroscope-app>
      </Provider>
    </PluginPropsContext.Provider>
  );
}
