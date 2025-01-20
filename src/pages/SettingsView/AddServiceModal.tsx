// a modal for adding a new service
import { css } from '@emotion/css';
import { GrafanaTheme2 } from '@grafana/data';
import { Button, Cascader, ConfirmModal, FieldSet, Icon, Tooltip, useStyles2 } from '@grafana/ui';
import React, { useMemo, useState } from 'react';

import { buildServiceNameCascaderOptions } from '../ProfilesExplorerView/domain/variables/ServiceNameVariable/domain/useBuildServiceNameOptions';
import { useServiceList } from './domain/useServiceList';

type AddServiceModalProps = {
  onServiceAdd(name: string, enabled: boolean): void;
};

const SERVICE_NAME_ERROR_MESSAGE =
  'Service name is not valid, it must consist of one or more UTF-8 letters (A through Z, both upper- and lower-case), digits, underscores or slashes.';
const validateServiceName = (name: string): string | boolean => {
  const regex = /^[A-Za-z0-9_\-\/]+$/;
  return regex.test(name) || SERVICE_NAME_ERROR_MESSAGE;
};

export function AddServiceModal({ onServiceAdd }: AddServiceModalProps) {
  const { isFetching, error, serviceNames } = useServiceList();

  const [showModal, setShowModal] = useState<boolean>(false);

  const [validName, setValidName] = useState<string | boolean>(true);
  const [name, setName] = useState<string>();

  const styles = useStyles2(getStyles);

  const cascaderOptions = useMemo(() => buildServiceNameCascaderOptions(serviceNames), [serviceNames]);

  function onNameValue(serviceName: string) {
    setName(serviceName);
    setValidName(validateServiceName(serviceName));
  }
  return (
    <>
      <Button icon={'plus'} onClick={() => setShowModal(true)}>
        Add service
      </Button>
      {showModal && (
        <ConfirmModal
          isOpen
          title={`Add service`}
          body={
            <FieldSet label={'Add new service'} className={styles.ct}>
              {error && (
                <Tooltip theme="error" content={error.toString()}>
                  <Icon className={styles.iconError} name="exclamation-triangle" size="xl" />
                </Tooltip>
              )}
              {!validName && (
                <Tooltip theme="error" content={validName.toString()}>
                  <Icon className={styles.iconError} name="exclamation-triangle" size="xl" />
                </Tooltip>
              )}
              {!error && (
                <Cascader
                  aria-label="Services list"
                  width={32}
                  separator="/"
                  displayAllSelectedLevels
                  placeholder={isFetching ? 'Loading services...' : `Select a service (${cascaderOptions.length})`}
                  options={cascaderOptions}
                  changeOnSelect={false}
                  onSelect={onNameValue}
                />
              )}
            </FieldSet>
          }
          confirmText={'Add'}
          confirmButtonVariant="primary"
          onConfirm={() => {
            if (name !== undefined) {
              onServiceAdd(name, false);
            }
            setShowModal(false);
            setValidName(true);
            setName(undefined);
          }}
          dismissVariant="secondary"
          onDismiss={() => {
            setShowModal(false);
            setValidName(true);
            setName(undefined);
          }}
        />
      )}
    </>
  );
}

function getStyles(theme: GrafanaTheme2) {
  return {
    name: css({
      width: '50%',
    }),
    ct: css({
      display: 'flex',
      flexDirection: 'column',
      gap: theme.spacing(2),
    }),
    iconError: css`
      height: 32px;
      align-self: center;
      color: ${theme.colors.error.text};
    `,
  };
}
