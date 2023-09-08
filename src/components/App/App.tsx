import * as React from 'react';
import { AppRootProps } from '@grafana/data';
import { Route, Switch, Redirect } from 'react-router-dom';
import '../../styles/styles.scss';
import TagExplorerView from '@pyroscope/pages/TagExplorerView';
import ContinuousSingleView from '@pyroscope/pages/ContinuousSingleView';
import ContinuousDiffView from '@pyroscope/pages/ContinuousDiffView';
import ContinuousComparisonView from '@pyroscope/pages/ContinuousComparisonView';
import { useSelectFirstApp } from '@pyroscope/hooks/useAppNames';
import { Provider } from 'react-redux';
import store from '@pyroscope/redux/store';
import { ROUTES } from '../../constants';
import { PluginPropsContext } from '../../utils/utils.plugin';
import { useTheme2 } from '@grafana/ui';
import { useNavigation, prefixRoute, useNavigationLinksUpdate } from '../../utils/utils.routing';
import { Onboarding } from '../../pages/Onboarding';
import '../../utils/faro';
import { PyroscopeStateWrapper } from '../PyroscopeState/PyroscopeStateWrapper';

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
  useSelectFirstApp();
  useNavigationLinksUpdate();

  return (
    <Onboarding>
      <PyroscopeStateWrapper>
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
      </PyroscopeStateWrapper>
    </Onboarding>
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
