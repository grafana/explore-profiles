import { css } from '@emotion/css';
import { GrafanaTheme2 } from '@grafana/data';
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
      'Error while retrieving the plugin settings!',
      'Please try to reload the page, sorry for the inconvenience.',
    ]);
  }

  function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    actions.saveSettings();
  }

  return (
    <form className={styles.settingsForm} onSubmit={onSubmit}>
      <FieldSet label="Flame graph" data-testid="flamegraph-settings">
        <InlineFieldRow>
          <InlineField label="Collapsed flame graphs" labelWidth={24}>
            <InlineSwitch
              label="Toggle collapsed flame graphs"
              name="collapsed-flamegraphs"
              value={data.collapsedFlamegraphs}
              onChange={actions.toggleCollapsedFlamegraphs}
            />
          </InlineField>
        </InlineFieldRow>
        <InlineFieldRow>
          <InlineField label="Maximum number of nodes" tooltip="" labelWidth={24}>
            <Input name="max-nodes" type="number" min="1" value={data.maxNodes} onChange={actions.updateMaxNodes} />
          </InlineField>
        </InlineFieldRow>
      </FieldSet>
      <FieldSet label="Function details" data-testid="function-details-settings">
        <InlineFieldRow>
          <InlineField
            label="Enable function details"
            labelWidth={24}
            tooltip={
              <div className={styles.tooltip}>
                <p>
                  The function details feature enables mapping of resource usage to lines of source code. If the GitHub
                  integration is configured, then the source code will be downloaded from GitHub.
                </p>
                <p>
                  <a
                    href="https://grafana.com/docs/grafana-cloud/monitor-applications/profiles/pyroscope-github-integration/"
                    target="_blank"
                    rel="noreferrer noopener"
                  >
                    Learn more
                  </a>
                </p>
              </div>
            }
            interactive
          >
            <InlineSwitch
              label="Toggle function details"
              name="function-details-feature"
              value={data.enableFunctionDetails}
              onChange={actions.toggleEnableFunctionDetails}
            />
          </InlineField>
        </InlineFieldRow>
      </FieldSet>

      {featureToggles.metricsFromProfiles && (
        <FieldSet label="Metrics from profiles" data-testid="metrics-from-profiles">
          <Alert severity="info" title="" className={css({ maxWidth: '1000px' })}>
            {data.enableMetricsFromProfiles ? (
              <>
                <p>
                  Disabling this feature only hides it from the UI. No existing recording rules are removed. These rules
                  will remain active and continue to export metrics, which will still impact your bill.
                </p>
                <p>To stop exporting data, delete all related recording rules before disabling this feature.</p>
              </>
            ) : (
              <p>
                Enabling this feature lets you define recording rules from Profiles Drilldown. Any recording rules you
                create will send new metrics to your Grafana Cloud instance, increasing your data usage in Grafana Mimir
                and potentially affecting your bill.
              </p>
            )}
          </Alert>
          <InlineFieldRow>
            <InlineField
              label="Enable metrics from profiles"
              tooltip="Allows creating recording rules from profiles"
              labelWidth={30}
            >
              <InlineSwitch
                label="Enable metrics from profiles"
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
