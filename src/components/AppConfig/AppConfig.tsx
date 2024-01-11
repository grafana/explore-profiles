import React from 'react';
import {
  Alert,
  Button,
  FieldSet,
  Form,
  InlineField,
  InlineFieldRow,
  InlineSwitch,
  Input,
  VerticalGroup,
} from '@grafana/ui';
import { PluginConfigPageProps, AppPluginMeta } from '@grafana/data';

import { useAppConfig } from './hooks/useAppConfig';
import { AppPluginSettings } from '../../types/plugin';

export interface AppConfigProps extends PluginConfigPageProps<AppPluginMeta<AppPluginSettings>> {}

export const AppConfig = () => {
  const { data, actions } = useAppConfig();

  return (
    <>
      <Alert title="Plugin settings" severity="warning">
        <VerticalGroup>
          Currently, the settings are not persisted. It means that you can change them and that they will be properly
          applied until your Grafana instance is restarted. But after the restart, they will all get reseted to their
          default values. It is a temporary situation, we are actively working to fix it. Thank you for your patience.
        </VerticalGroup>
      </Alert>
      <Form onSubmit={actions.saveSettings}>
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
    </>
  );
};
