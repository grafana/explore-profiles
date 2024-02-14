import { css } from '@emotion/css';
import { GrafanaTheme2 } from '@grafana/data';
import { useStyles2 } from '@grafana/ui';
import ContinuousComparisonView from '@pyroscope/pages/ContinuousComparisonView';
import ContinuousDiffView from '@pyroscope/pages/ContinuousDiffView';
import TagExplorerView from '@pyroscope/pages/TagExplorerView';
import React from 'react';
import { Redirect, Route, Switch } from 'react-router-dom';

import { ROUTES } from '../../constants';
import { AdHocView } from '../../pages/AdHocView/AdHocView';
import ContinuousDiffViewAi from '../../pages/ai/ContinuousDiffViewAi/ContinuousDiffViewAi';
import ContinuousSingleViewAi from '../../pages/ai/ContinuousSingleViewAi/ContinuousSingleViewAi';
import { SettingsView } from '../../pages/SettingsView/SettingsView';
import { SingleView } from '../../pages/SingleView/SingleView';
import useConsistentTheme from '../ui/useConsistentTheme';
import { PyroscopeStateWrapper } from './PyroscopeState/PyroscopeStateWrapper';
import { prefixRoute, useNavigationLinksUpdate } from './useNavigationLinksUpdate';
import { VersionInfoTooltip } from './VersionInfoTooltip';

const getStyles = (theme: GrafanaTheme2) => ({
  page: css`
    background: ${theme.colors.background.canvas};
    padding: ${theme.spacing(2)};
    border: ${theme.colors.border.medium} solid 1px;
  `,
  versionTips: css`
    position: relative;
    left: ${theme.spacing(3.5)};
    bottom: ${theme.spacing(1)};
    height: 0px;
    text-align: right;
  `,
});

export function Routes() {
  const styles = useStyles2(getStyles);
  useConsistentTheme();

  // TODO: remove me when Pyroscope OSS migration is finished
  useNavigationLinksUpdate();

  return (
    <>
      <div className={styles.page}>
        <PyroscopeStateWrapper>
          <Switch>
            <Route path={prefixRoute(ROUTES.EXPLORE_VIEW)} exact>
              <TagExplorerView />
            </Route>
            <Route path={prefixRoute(ROUTES.SINGLE_VIEW_AI)} exact>
              <ContinuousSingleViewAi />
            </Route>
            <Route path={prefixRoute(ROUTES.SINGLE_VIEW)} exact>
              <SingleView />
            </Route>
            <Route path={prefixRoute(ROUTES.COMPARISON_DIFF_VIEW_AI)} exact>
              <ContinuousDiffViewAi />
            </Route>
            <Route path={prefixRoute(ROUTES.COMPARISON_VIEW)} exact>
              <ContinuousComparisonView />
            </Route>
            <Route path={prefixRoute(ROUTES.COMPARISON_DIFF_VIEW)} exact>
              <ContinuousDiffView />
            </Route>
            <Route path={prefixRoute(ROUTES.ADHOC_VIEW)} exact>
              <AdHocView />
            </Route>
            <Route path={prefixRoute(ROUTES.SETTINGS)} exact>
              <SettingsView />
            </Route>
            {/* Default Route */}
            <Route>
              <Redirect to={prefixRoute(ROUTES.EXPLORE_VIEW)} />
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
