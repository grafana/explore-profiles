import { css } from '@emotion/css';
import { GrafanaTheme2 } from '@grafana/data';
import { FieldSet, InlineField, InlineFieldRow, InlineSwitch, Input, useStyles2 } from '@grafana/ui';
import { displayError } from '@shared/domain/displayStatus';
import { useReportPageInitialized } from '@shared/infrastructure/tracking/useReportPageInitialized';
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

  useReportPageInitialized('settings');

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
