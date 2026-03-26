import { css } from '@emotion/css';
import { GrafanaTheme2 } from '@grafana/data';
import { t, Trans } from '@grafana/i18n';
import { Alert, FieldSet, InlineField, InlineFieldRow, InlineSwitch, Input, useStyles2 } from '@grafana/ui';
import { displayError } from '@shared/domain/displayStatus';
import { featureToggles } from '@shared/infrastructure/settings/featureToggles';
import React from 'react';

import { useUISettingsView } from './domain/useUISettingsView';

export function UISettingsView({ children }: { children: React.ReactNode }) {
  const styles = useStyles2(getStyles);
  const { data, actions } = useUISettingsView();

  if (data.fetchError) {
    displayError(data.fetchError, [
      t('settings.ui.fetch-error.title', 'Error while retrieving the plugin settings!'),
      t('settings.ui.fetch-error.message', 'Please try to reload the page, sorry for the inconvenience.'),
    ]);
  }

  function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    actions.saveSettings();
  }

  return (
    <form className={styles.settingsForm} onSubmit={onSubmit}>
      <FieldSet label={t('settings.ui.flame-graph.label', 'Flame graph')} data-testid="flamegraph-settings">
        <InlineFieldRow>
          <InlineField label={t('settings.ui.collapsed-flame-graphs.label', 'Collapsed flame graphs')} labelWidth={24}>
            <InlineSwitch
              label={t('settings.ui.collapsed-flame-graphs.toggle', 'Toggle collapsed flame graphs')}
              name="collapsed-flamegraphs"
              value={data.collapsedFlamegraphs}
              onChange={actions.toggleCollapsedFlamegraphs}
            />
          </InlineField>
        </InlineFieldRow>
        <InlineFieldRow>
          <InlineField label={t('settings.ui.max-nodes.label', 'Maximum number of nodes')} tooltip="" labelWidth={24}>
            <Input name="max-nodes" type="number" min="1" value={data.maxNodes} onChange={actions.updateMaxNodes} />
          </InlineField>
        </InlineFieldRow>
      </FieldSet>
      <FieldSet
        label={t('settings.ui.function-details.label', 'Function details')}
        data-testid="function-details-settings"
      >
        <InlineFieldRow>
          <InlineField
            label={t('settings.ui.enable-function-details.label', 'Enable function details')}
            labelWidth={24}
            tooltip={
              <div className={styles.tooltip}>
                <p>
                  <Trans i18nKey="settings.ui.enable-function-details.tooltip">
                    The function details feature enables mapping of resource usage to lines of source code. If the
                    GitHub integration is configured, then the source code will be downloaded from GitHub.
                  </Trans>
                </p>
                <p>
                  <a
                    href="https://grafana.com/docs/grafana-cloud/monitor-applications/profiles/pyroscope-github-integration/"
                    target="_blank"
                    rel="noreferrer noopener"
                  >
                    <Trans i18nKey="settings.ui.enable-function-details.learn-more">Learn more</Trans>
                  </a>
                </p>
              </div>
            }
            interactive
          >
            <InlineSwitch
              label={t('settings.ui.enable-function-details.toggle', 'Toggle function details')}
              name="function-details-feature"
              value={data.enableFunctionDetails}
              onChange={actions.toggleEnableFunctionDetails}
            />
          </InlineField>
        </InlineFieldRow>
      </FieldSet>

      {featureToggles.metricsFromProfiles && (
        <FieldSet
          label={t('settings.ui.metrics-from-profiles.label', 'Metrics from profiles')}
          data-testid="metrics-from-profiles"
        >
          <Alert severity="info" title="" className={css({ maxWidth: '1000px' })}>
            {data.enableMetricsFromProfiles ? (
              <>
                <p>
                  <Trans i18nKey="settings.ui.metrics-from-profiles.disable-warning">
                    Disabling this feature only hides it from the UI. No existing recording rules are removed. These
                    rules will remain active and continue to export metrics, which will still impact your bill.
                  </Trans>
                </p>
                <p>
                  <Trans i18nKey="settings.ui.metrics-from-profiles.disable-hint">
                    To stop exporting data, delete all related recording rules before disabling this feature.
                  </Trans>
                </p>
              </>
            ) : (
              <p>
                <Trans i18nKey="settings.ui.metrics-from-profiles.enable-warning">
                  Enabling this feature lets you define recording rules from Profiles Drilldown. Any recording rules you
                  create will send new metrics to your Grafana Cloud instance, increasing your data usage in Grafana
                  Mimir and potentially affecting your bill.
                </Trans>
              </p>
            )}
          </Alert>
          <InlineFieldRow>
            <InlineField
              label={t('settings.ui.metrics-from-profiles.toggle-label', 'Enable metrics from profiles')}
              tooltip={t('settings.ui.metrics-from-profiles.tooltip', 'Allows creating recording rules from profiles')}
              labelWidth={30}
            >
              <InlineSwitch
                label={t('settings.ui.metrics-from-profiles.toggle', 'Enable metrics from profiles')}
                name="metrics-from-profiles"
                value={data.enableMetricsFromProfiles}
                onChange={actions.toggleEnableMetricsFromProfiles}
              />
            </InlineField>
          </InlineFieldRow>
        </FieldSet>
      )}

      {children}
    </form>
  );
}

const getStyles = (theme: GrafanaTheme2) => ({
  settingsForm: css`
    & > fieldset {
      border: 0 none;
      border-bottom: 1px solid ${theme.colors.border.weak};
      padding-left: 0;
    }

    & > fieldset > legend {
      font-size: ${theme.typography.h4.fontSize};
    }
  `,
  buttons: css`
    display: flex;
    gap: ${theme.spacing(1)};
    margin-top: ${theme.spacing(3)};
  `,
  tooltip: css`
    p {
      margin: ${theme.spacing(1)};
    }

    a {
      color: ${theme.colors.text.link};
    }

    em {
      font-style: normal;
      font-weight: ${theme.typography.fontWeightBold};
    }
  `,
});
