// a component to edit rule parameters
import { ServiceData, UpsertCollectionRuleRequest } from '@buf/pyroscope_api.bufbuild_es/settings/v1/setting_pb';
import { css } from '@emotion/css';
import { GrafanaTheme2 } from '@grafana/data';
import {
  Button,
  Checkbox,
  Column,
  Field,
  FieldSet,
  Input,
  InteractiveTable,
  Modal,
  Stack,
  Switch,
  Tooltip,
  useStyles2,
} from '@grafana/ui';
import React from 'react';

import { AddService } from '../AddService/AddService';
import { useEditRule } from './domain/useEditRule';

export type EditRuleProps = {
  saveRule(rule: UpsertCollectionRuleRequest): Promise<void>;
  existingRule?: UpsertCollectionRuleRequest;
  existingRuleNames?: string[]; // required for validating that rule is unique
  setIsModified?(modified: boolean): void;
  isModified?: boolean;
  onDismiss?(): void;
  onSubmit?(): void;
  onDeploy?(): void;
};

type ServiceCell = { original: ServiceData };
type ServiceCellProps = { row: ServiceCell };

export function EditRule(props: EditRuleProps) {
  const styles = useStyles2(getStyles);
  const { data, actions } = useEditRule(props);

  const columns: Array<Column<ServiceData>> = [
    {
      id: 'name',
      sortType: 'string',
      header: 'Name',
    },
    {
      id: 'enabled',
      header: 'Active',
      sortType: (r1: ServiceCell, r2: ServiceCell) => Number(r2.original.enabled) - Number(r1.original.enabled),
      cell: ({ row: { original: service } }: ServiceCellProps) => (
        <Switch
          value={service.enabled}
          onChange={(ev: React.FormEvent<HTMLInputElement>) =>
            actions.addService(service.name, ev.currentTarget.checked)
          }
        />
      ),
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row: { original: service } }: ServiceCellProps) => (
        <div className={styles.editButtons}>
          <Tooltip content="Delete">
            <Button
              icon={'trash-alt'}
              variant={'secondary'}
              fill="text"
              onClick={() => actions.removeService(service.name)}
            />
          </Tooltip>
        </div>
      ),
    },
  ];

  return (
    <form className={styles.editForm} onSubmit={actions.handleSubmit}>
      <>
        <FieldSet>
          {data.isNewRule && (
            <Field
              label="Rule name"
              description={data.nameDescription}
              required
              invalid={data.rule.name.length > 0 && data.nameErrors.length > 0}
              error={
                data.rule.name &&
                data.nameErrors.map((e, idx) => (
                  <span key={idx}>
                    {e}
                    <br />
                  </span>
                ))
              }
            >
              <Input
                name="ruleName"
                type="text"
                placeholder={data.nameDescription}
                onChange={actions.updateName}
                autoFocus
              />
            </Field>
          )}
          <Field label="eBPF Collection" description="Enable Profile collection using eBPF profiler.">
            <Checkbox name="ebpfEnabled" onChange={actions.updateEbpfEnabled} value={data.rule.ebpf?.enabled} />
          </Field>
          <Field label="Java Collection" description="Enable Profile collection using Java process attachment.">
            <Checkbox name="javaEnabled" onChange={actions.updateJavaEnabled} value={data.rule.java?.enabled} />
          </Field>
          <Stack gap={2} alignItems="flex-end" justifyContent="end">
            <AddService existingServiceNames={data.serviceNames} onServiceAdd={actions.addService} />
          </Stack>
          <Stack gap={2}>
            {/* TODO: Figure out how filtering works */}
            <InteractiveTable<ServiceData>
              data={data.filteredServices}
              pageSize={100}
              getRowId={(service: ServiceData) => service.name}
              columns={columns}
            />
          </Stack>
        </FieldSet>
        {data.isNewRule && (
          <Modal.ButtonRow>
            <Button variant="secondary" fill="outline" onClick={props.onDismiss}>
              Cancel
            </Button>
            <Button type="submit" disabled={data.rule.name.length === 0 || data.nameErrors.length > 0}>
              {data.isNewRule ? 'Add' : 'Save'}
            </Button>
          </Modal.ButtonRow>
        )}
        {!data.isNewRule && (
          <Stack gap={2} alignItems="flex-end" justifyContent="end">
            <Button variant="secondary" disabled={!data.isModified} onClick={actions.handleReset}>
              Reset
            </Button>
            {data.isModified && (
              <Button variant="primary" type="submit">
                Save
              </Button>
            )}
            {!data.isModified && (
              <Button variant="primary" onClick={() => props.onDeploy?.()}>
                Deploy
              </Button>
            )}
          </Stack>
        )}
      </>
    </form>
  );
}

function getStyles(theme: GrafanaTheme2) {
  return {
    // copied from UISettings
    editForm: css`
      fieldset {
        border: 0 none;
        padding: 0 0 ${theme.spacing(2)} 0;
        border-bottom: 1px solid ${theme.colors.border.weak};
      }

      fieldset > legend {
        font-size: ${theme.typography.h5.fontSize};
      }
    `,
    editButtons: css({
      display: 'flex',
      columnGap: theme.spacing(0.5),
      justifyContent: 'flex-end',
    }),
  };
}
