import { css } from '@emotion/css';
import { PageLayoutType } from '@grafana/data';
import { PluginPage } from '@grafana/runtime';
import { Button, FieldSet, Form, InlineField, InlineFieldRow, InlineSwitch, Input, useStyles2 } from '@grafana/ui';
import { displayError } from '@shared/domain/displayStatus';
import React from 'react';

import { useSettingsView } from './domain/useSettingsView';

const getStyles = () => ({
  settingsForm: css`
    & > fieldset {
      border: 0 none;
      padding-left: 0;
    }
  `,
});

export function SettingsView() {
  const styles = useStyles2(getStyles);
  const { data, actions } = useSettingsView();

  if (data.fetchError) {
    displayError(data.fetchError, [
      'Error while retrieving the plugin settings!',
      'Please try to reload the page, sorry for the inconvenience.',
    ]);
  }

  return (
    <PluginPage layout={PageLayoutType.Custom} renderTitle={() => null}>
      <Form className={styles.settingsForm} onSubmit={actions.saveSettings}>
        {() => (
          <>
            <FieldSet label="Flame graph settings" data-testid="flamegraph-settings">
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
                  <Input
                    name="max-nodes"
                    type="number"
                    min="1"
                    value={data.maxNodes}
                    onChange={actions.updateMaxNodes}
                  />
                </InlineField>
              </InlineFieldRow>
            </FieldSet>
            <FieldSet label="Export settings" data-testid="export-settings">
              <InlineFieldRow>
                <InlineField label="Enable flamegraph.com" labelWidth={24}>
                  <InlineSwitch
                    label="Toggle export to flamegraph.com"
                    name="export-flamegraph-com"
                    value={data.enableFlameGraphDotComExport}
                    onChange={actions.toggleEnableFlameGraphDotComExport}
                  />
                </InlineField>
              </InlineFieldRow>
            </FieldSet>
            <FieldSet label="Function details settings" data-testid="function-details-settings">
              <InlineFieldRow>
                <InlineField
                  label="Enable function details"
                  labelWidth={24}
                  tooltip={
                    <>
                      <div>
                        The function details feature enables mapping of resource usage to lines of source code. If the
                        GitHub integration is configured, then the source code will be downloaded from GitHub.
                      </div>
                      <div>
                        {/* TODO(bryan): Update this with the live GitHub integration docs when they go live. */}
                        <a href="https://grafana.com/docs/" target="_blank" rel="noreferrer noopener">
                          Learn more
                        </a>
                      </div>
                    </>
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

            <Button variant="primary" type="submit">
              Save settings
            </Button>
          </>
        )}
      </Form>
    </PluginPage>
  );
}
