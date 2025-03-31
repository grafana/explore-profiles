import { css } from '@emotion/css';
import { GrafanaTheme2 } from '@grafana/data';
import {
  Button,
  FieldSet,
  InlineField,
  InlineFieldRow,
  InlineSwitch,
  Input,
  Tab,
  TabsBar,
  useStyles2,
} from '@grafana/ui';
import { displayError } from '@shared/domain/displayStatus';
import { ApiClient } from '@shared/infrastructure/http/ApiClient';
import { useReportPageInitialized } from '@shared/infrastructure/tracking/useReportPageInitialized';
import { PageTitle } from '@shared/ui/PageTitle';
import React, { useState } from 'react';

import { CollectorSettings } from './components/CollectorSettings';
import { useSettingsView } from './domain/useSettingsView';

export default function SettingsView() {
  const styles = useStyles2(getStyles);
  const { data, actions } = useSettingsView();
  const [activeTab, setActiveTab] = useState(0);

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

  // Define the built-in tabs
  const builtInTabs = [
    {
      label: 'Flame Graph',
      content: (
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
      ),
    },
    {
      label: 'Function Details',
      content: (
        <FieldSet label="Function details" data-testid="function-details-settings">
          <InlineFieldRow>
            <InlineField
              label="Enable function details"
              labelWidth={24}
              tooltip={
                <div className={styles.tooltip}>
                  <p>
                    The function details feature enables mapping of resource usage to lines of source code. If the
                    GitHub integration is configured, then the source code will be downloaded from GitHub.
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
      ),
    },
  ];

  // Get the extension components
  const pyroscopeDataSource = ApiClient.selectDefaultDataSource();
  const pluginTabs = [
    {
      label: 'Collector Settings',
      content: CollectorSettings({ datasource_id: pyroscopeDataSource.uid }),
    },
  ].filter((f) => f.content !== null && f.content !== undefined);

  const allTabs = [...builtInTabs, ...pluginTabs];

  return (
    <>
      <PageTitle title="Profiles settings (tenant)" />
      <form className={styles.settingsForm} onSubmit={onSubmit}>
        <TabsBar>
          {allTabs.map((tab, index) => (
            <Tab
              key={`settings-tab-${index}`}
              label={tab.label}
              active={activeTab === index}
              onChangeTab={() => setActiveTab(index)}
            />
          ))}
        </TabsBar>

        {allTabs[activeTab]?.content}

        <div className={styles.buttons}>
          <Button variant="primary" type="submit">
            Save settings
          </Button>
          <Button variant="secondary" onClick={actions.goBack} aria-label="Back to Grafana Profiles Drilldown">
            Back to Grafana Profiles Drilldown
          </Button>
        </div>
      </form>
    </>
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
