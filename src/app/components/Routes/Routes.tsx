import { css } from '@emotion/css';
import { GrafanaTheme2 } from '@grafana/data';
import { useStyles2 } from '@grafana/ui';
import TagExplorerView from '@pyroscope/pages/TagExplorerView';
import { prefixRouteWithPluginBaseUrl } from '@shared/domain/prefixRouteWithPluginBaseUrl';
import React from 'react';
import { Redirect, Route, Switch } from 'react-router-dom';

import { ROUTES } from '../../../constants';
import { AdHocView } from '../../../pages/AdHocView/AdHocView';
import { ComparisonDiffView } from '../../../pages/ComparisonDiffView/ComparisonDiffView';
import { ComparisonView } from '../../../pages/ComparisonView/ComparisonView';
import { SettingsView } from '../../../pages/SettingsView/SettingsView';
import { SingleView } from '../../../pages/SingleView/components/SingleView';
import { PyroscopeStateWrapper } from './domain/PyroscopeState/PyroscopeStateWrapper';
import useConsistentTheme from './domain/useConsistentTheme';
import { useNavigationLinksUpdate } from './domain/useNavigationLinksUpdate';
import { VersionInfoTooltip } from './ui/VersionInfoTooltip';

const getStyles = (theme: GrafanaTheme2) => ({
  page: css`
    background: ${theme.colors.background.canvas};
    padding: ${theme.spacing(2)};
    border: ${theme.colors.border.medium} solid 1px;
  `,
  versionTips: css`
    position: relative;
    left: ${theme.spacing(3.5)};
    bottom: ${theme.spacing(2.5)};
    height: 0px;
    text-align: right;
  `,
});

export function Routes() {
  const styles = useStyles2(getStyles);

  useConsistentTheme();
  useNavigationLinksUpdate();

  return (
    <>
      <div className={styles.page}>
        <PyroscopeStateWrapper>
          <Switch>
            <Route path={prefixRouteWithPluginBaseUrl(ROUTES.EXPLORE_VIEW)} exact>
              <TagExplorerView />
            </Route>
            <Route path={prefixRouteWithPluginBaseUrl(ROUTES.SINGLE_VIEW)} exact>
              <SingleView />
            </Route>
            <Route path={prefixRouteWithPluginBaseUrl(ROUTES.COMPARISON_VIEW)} exact>
              <ComparisonView />
            </Route>
            <Route path={prefixRouteWithPluginBaseUrl(ROUTES.COMPARISON_DIFF_VIEW)} exact>
              <ComparisonDiffView />
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
        </PyroscopeStateWrapper>
      </div>
      <div className={styles.versionTips}>
        <VersionInfoTooltip />
      </div>
    </>
  );
}
