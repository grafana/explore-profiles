import { css } from '@emotion/css';
import { GrafanaTheme2, usePluginContext } from '@grafana/data';
import { t, Trans } from '@grafana/i18n';
import { config } from '@grafana/runtime';
import { Dropdown, IconButton, Menu, useStyles2 } from '@grafana/ui';
import React from 'react';

import { GIT_COMMIT } from '../../version';
import { PyroscopeLogo } from './PyroscopeLogo';

const pluginCommitSha: string = GIT_COMMIT;
const pluginCommitURL = `https://github.com/grafana/profiles-drilldown/commit/${pluginCommitSha}`;

const { buildInfo: grafanaBuildInfo } = config;

function InfoMenuHeader() {
  const styles = useStyles2(getStyles);

  const {
    meta: {
      info: { version, updated },
    },
  } = usePluginContext() || { meta: { info: { version: '?.?.?', updated: '?' } } };

  return (
    <div className={styles.menuHeader}>
      <h5>
        <PyroscopeLogo size="small" />
        <Trans i18nKey="plugin-info.version">Grafana Profiles Drilldown v{{ version }}</Trans>
      </h5>
      <div className={styles.subTitle}>
        <Trans i18nKey="plugin-info.last-update">Last update: {{ updated }}</Trans>
      </div>
    </div>
  );
}

function InfoMenu() {
  const isDev = pluginCommitSha === 'dev';
  const shortCommitSha = isDev ? pluginCommitSha : pluginCommitSha.slice(0, 8);

  return (
    <Menu header={<InfoMenuHeader />}>
      <Menu.Item
        label={t('plugin-info.commit-sha', 'Commit SHA: {{shortCommitSha}}', { shortCommitSha })}
        icon="github"
        onClick={() => window.open(pluginCommitURL)}
        disabled={isDev}
      />
      <Menu.Item
        label={t('plugin-info.changelog', 'Changelog')}
        icon="list-ul"
        onClick={() => window.open('https://github.com/grafana/profiles-drilldown/blob/main/CHANGELOG.md')}
      />
      <Menu.Item
        label={t('plugin-info.contribute', 'Contribute')}
        icon="external-link-alt"
        onClick={() => window.open('https://github.com/grafana/profiles-drilldown/blob/main/docs/CONTRIBUTING.md')}
      />
      <Menu.Item
        label={t('plugin-info.documentation', 'Documentation')}
        icon="document-info"
        onClick={() => window.open('https://grafana.com/docs/grafana/latest/explore/simplified-exploration/profiles')}
      />
      <Menu.Item
        label={t('plugin-info.report-issue', 'Report an issue')}
        icon="bug"
        onClick={() => window.open('https://github.com/grafana/profiles-drilldown/issues/new?template=bug_report.md')}
      />
      <Menu.Divider />
      <Menu.Item
        label={t('plugin-info.grafana-version', 'Grafana {{edition}} v{{version}} ({{env}})', {
          edition: grafanaBuildInfo.edition,
          version: grafanaBuildInfo.version,
          env: grafanaBuildInfo.env,
        })}
        icon="github"
        onClick={() => window.open(`https://github.com/grafana/grafana/commit/${grafanaBuildInfo.commit}`)}
      />
    </Menu>
  );
}

export function PluginInfo() {
  return (
    <Dropdown overlay={() => <InfoMenu />} placement="bottom-end">
      <IconButton
        name="info-circle"
        aria-label={t('plugin-info.aria-label', 'Plugin info')}
        title={t('plugin-info.title', 'Plugin info')}
      />
    </Dropdown>
  );
}

const getStyles = (theme: GrafanaTheme2) => ({
  menuHeader: css`
    padding: ${theme.spacing(0.5, 1)};
    white-space: nowrap;
  `,
  subTitle: css`
    color: ${theme.colors.text.secondary};
    font-size: ${theme.typography.bodySmall.fontSize};
  `,
});
