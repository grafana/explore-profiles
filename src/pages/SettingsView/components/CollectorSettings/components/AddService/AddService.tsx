// a modal for adding a new service
import { css } from '@emotion/css';
import { GrafanaTheme2 } from '@grafana/data';
import { Button, Cascader, Icon, Tooltip, useStyles2 } from '@grafana/ui';
import React from 'react';

import { useAddService } from './domain/useAddService';

export type AddServiceProps = {
  onServiceAdd(name: string, enabled: boolean): void;
  existingServiceNames: string[];
};

export function AddService(props: AddServiceProps) {
  const { data, actions } = useAddService(props);

  const styles = useStyles2(getStyles);

  return (
    <>
      {data.error && (
        <Tooltip theme="error" content={data.error.toString()}>
          <Icon className={styles.iconError} name="exclamation-triangle" size="xl" />
        </Tooltip>
      )}
      {!data.error && (
        <>
          {/* TODO: Should this be a ButtonCascader  */}
          {/* TODO: After selecting, should be reset somehow  */}
          <Cascader
            aria-label="Services list"
            width={32}
            separator="/"
            displayAllSelectedLevels
            placeholder={
              data.isFetching ? 'Loading services...' : `Select a service to add (${data.cascaderOptions.length})`
            }
            options={data.cascaderOptions}
            changeOnSelect={false}
            onSelect={actions.addService}
          />
          <Button
            icon={'plus'}
            variant="secondary"
            disabled={props.existingServiceNames.length === 0}
            onClick={actions.addAllServices}
          >
            Add all services
          </Button>
        </>
      )}
    </>
  );
}

function getStyles(theme: GrafanaTheme2) {
  return {
    iconError: css`
      height: 32px;
      align-self: center;
      color: ${theme.colors.error.text};
    `,
  };
}
