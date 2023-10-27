import React from 'react';
import { Button, FieldSet, Form, InlineField, InlineFieldRow, InlineSwitch } from '@grafana/ui';
import { PluginConfigPageProps, AppPluginMeta } from '@grafana/data';

import { useAppConfig } from './hooks/useAppConfig';
import { AppPluginSettings } from '../../types/plugin';

export interface AppConfigProps extends PluginConfigPageProps<AppPluginMeta<AppPluginSettings>> {}

export const AppConfig = ({ plugin }: AppConfigProps) => {
  const { data, actions } = useAppConfig(plugin);

  return (
    <Form onSubmit={actions.saveConfiguration}>
      {() => (
        <>
          <FieldSet label="Export Settings">
            <InlineFieldRow>
              <InlineField label="Enable flamegraph.com">
                <InlineSwitch
                  name="export-flamegraph-com"
                  value={data.enableFlameGraphDotComExport}
                  onChange={actions.toggleEnableFlameGraphDotComExport}
                />
              </InlineField>
            </InlineFieldRow>
          </FieldSet>

          <Button variant="primary" type="submit">
            Save settings & reload
          </Button>
        </>
      )}
    </Form>
  );
};
