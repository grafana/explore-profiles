import { css } from '@emotion/css';
import { GrafanaTheme2, usePluginContext } from '@grafana/data';
import { Icon, Label, Toggletip, VerticalGroup, useStyles2 } from '@grafana/ui';
import ContinuousComparisonView from '@pyroscope/pages/ContinuousComparisonView';
import ContinuousDiffView from '@pyroscope/pages/ContinuousDiffView';
import ContinuousSingleView from '@pyroscope/pages/ContinuousSingleView';
import TagExplorerView from '@pyroscope/pages/TagExplorerView';
import * as React from 'react';
import { Redirect, Route, Switch } from 'react-router-dom';
import { ROUTES } from '../../constants';
import useConsistentTheme from '../../hooks/useConsistentTheme';
import { prefixRoute, useNavigationLinksUpdate } from '../../utils/utils.routing';
import { GIT_COMMIT } from '../../version';
import { PyroscopeStateWrapper } from '../PyroscopeState/PyroscopeStateWrapper';

// Extract version information from the package.json files
// The consequences of importing them into the source code are that the contents of these package files will be in the built result
// The pyroscope package file is publically available in open source, the plugin package file is not, but on the most part it resembles
// the boilerplate generated by Grafana's plugin scaffolding.
import pluginPackageJson from '../../../package.json';
const { dependencies } = pluginPackageJson;
const pyroscopeGitInfo = dependencies['grafana-pyroscope'];

/* eslint-enable no-unused-vars */
export function Routes() {
  useNavigationLinksUpdate();
  useConsistentTheme();

  const styles = useStyles2(getStyles);
  const {
    meta: {
      info: { updated },
    },
  } = usePluginContext();

  const versionInfo = React.useMemo(() => {
    const pyroscopeCommitSha = pyroscopeGitInfo.split('#')[1];
    const pyroscopeCommitURL = `https://github.com/grafana/pyroscope/commit/${pyroscopeCommitSha}`;
    const pluginCommitSha = GIT_COMMIT;
    const pluginCommitURL = `https://github.com/grafana/pyroscope-app-plugin/commit/${pluginCommitSha}`;

    // Convert 'updated' to a readable date format if it's a timestamp
    const updatedDate = new Date(updated).toLocaleString(); // or another date formatting

    return (
      <VerticalGroup spacing="xs">
        <Label description={`Last updated: ${updatedDate}`}>Updated:</Label>
        <Label description={pluginCommitSha}>
          <a href={pluginCommitURL} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'underline' }}>
            Plugin commit sha:
          </a>
        </Label>
        <Label description={pyroscopeCommitSha}>
          <a
            href={pyroscopeCommitURL}
            target="_blank"
            rel="noopener noreferrer"
            style={{ textDecoration: 'underline' }}
          >
            OSS Pyroscope commit sha:
          </a>
        </Label>
      </VerticalGroup>
    );
  }, [updated]);

  return (
    <>
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
      <div className={styles.versionTips}>
        <Toggletip content={versionInfo} theme="info" placement="top-start">
          <Icon name="info-circle" />
        </Toggletip>
      </div>
    </>
  );
}

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