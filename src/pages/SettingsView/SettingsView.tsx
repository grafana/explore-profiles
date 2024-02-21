import { css } from '@emotion/css';
import { PageLayoutType } from '@grafana/data';
import { PluginPage } from '@grafana/runtime';
import { Button, FieldSet, Form, InlineField, InlineFieldRow, InlineSwitch, Input, useStyles2 } from '@grafana/ui';
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

  return (
    <PluginPage layout={PageLayoutType.Custom} renderTitle={() => null}>
      <Form className={styles.settingsForm} onSubmit={actions.saveSettings}>
        {() => (
          <>
            <FieldSet label="Flamegraph Settings" data-testid="flamegraph-settings">
              <InlineFieldRow>
                <InlineField label="Collapsed flamegraphs" labelWidth={24}>
                  <InlineSwitch
                    label="Toggle collapsed flamegraphs"
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
            <FieldSet label="Export Settings" data-testid="export-settings">
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

            <Button variant="primary" type="submit">
              Save settings
            </Button>
          </>
        )}
      </Form>
    </PluginPage>
  );
}
