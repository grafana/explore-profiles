import * as React from 'react';
import { AppRootProps, GrafanaTheme2, PageLayoutType, PluginContextProvider, usePluginContext } from '@grafana/data';
import { Route, Switch, Redirect } from 'react-router-dom';
import '../../styles/styles.scss';
import TagExplorerView from '@pyroscope/pages/TagExplorerView';
import ContinuousSingleView from '@pyroscope/pages/ContinuousSingleView';
import ContinuousDiffView from '@pyroscope/pages/ContinuousDiffView';
import ContinuousComparisonView from '@pyroscope/pages/ContinuousComparisonView';
import { Provider } from 'react-redux';
import store from '@pyroscope/redux/store';
import { ROUTES } from '../../constants';
import { useStyles2, useTheme2 } from '@grafana/ui';
import { prefixRoute, useNavigationLinksUpdate } from '../../utils/utils.routing';
import { Onboarding } from '../../pages/Onboarding';
import '../../utils/faro';
import { PyroscopeStateWrapper } from '../PyroscopeState/PyroscopeStateWrapper';
import { css } from '@emotion/css';
import { PluginPage } from '@grafana/runtime';
import { TitleReplacement } from './TitleReplacement';

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
  useNavigationLinksUpdate();

  const styles = useStyles2(getStyles);

  return (
    <div className={styles.page}>
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
    </div>
  );
}

export function App(props: AppRootProps) {
  const theme = useTheme2();

  const renderTitle = React.useCallback((title: string) => <TitleReplacement subtitle={title} />, []);

  return (
    <PluginContextProvider meta={props.meta}>
      <Provider store={store}>
        <Onboarding>
          <PluginPage layout={PageLayoutType.Standard} renderTitle={renderTitle}>
            <pyroscope-app className="app" data-theme={theme.name.toLowerCase()}>
              <div className="pyroscope-app">
                <Routes />
              </div>
            </pyroscope-app>
          </PluginPage>
        </Onboarding>
      </Provider>
    </PluginContextProvider>
  );
}

const getStyles = (theme: GrafanaTheme2) => ({
  page: css`
    background: ${theme.colors.background.canvas};
    padding: ${theme.spacing(2)};
    border: ${theme.colors.border.medium} solid 1px;
  `,
  logo: css`
    width: ${theme.spacing(6)};
    height: ${theme.spacing(6)};
  `,
});
