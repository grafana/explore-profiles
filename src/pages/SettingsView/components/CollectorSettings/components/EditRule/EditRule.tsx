// a component to edit rule parameters
import { ServiceData, UpsertCollectionRuleRequest } from '@buf/pyroscope_api.bufbuild_es/settings/v1/setting_pb';
import { css } from '@emotion/css';
import { GrafanaTheme2 } from '@grafana/data';
import { Button, Checkbox, Field, FieldSet, Input, InteractiveTable, Modal, Stack, useStyles2 } from '@grafana/ui';
import React from 'react';

import { useEditRule } from './domain/useEditRule';

export type EditRuleProps = {
  saveRule(rule: UpsertCollectionRuleRequest): void;
  existingRule?: UpsertCollectionRuleRequest;
  isModal: boolean;
};

const RULE_NAME_ERROR_MESSAGE = 'Please enter a valid rule name. It can contain lowercase letters, digits or hyphens.';

export function EditRule(props: EditRuleProps) {
  const styles = useStyles2(getStyles);
  const { data, actions } = useEditRule(props);

  return (
    <form onSubmit={actions.addRule}>
      <FieldSet className={styles.editRule}>
        <Field
          label="Rule name"
          required
          invalid={data.name && data.isNameInvalid}
          error={data.name && data.isNameInvalid ? RULE_NAME_ERROR_MESSAGE : undefined}
        >
          <Input
            name="ruleName"
            type="text"
            placeholder="Must be lowercase, can contain digits or hyphens"
            onChange={actions.updateName}
            autoFocus
          />
        </Field>
        <Field label="eBPF Collection" description="Enable Profile collection using eBPF profiler.">
          <Checkbox name="ebpfEnabled" onChange={actions.updateEbpfEnabled} value={data.rule.ebpfEnabled} />
        </Field>
        <Field label="Java Collection" description="Enable Profile collection using Java process attachment.">
          <Checkbox name="javaEnabled" onChange={actions.updateEbpfEnabled} value={data.rule.javaEnabled} />
        </Field>
        <Stack gap={2} alignItems="flex-end" justifyContent="end">
          // TODO: This should be having the cascader / and a add all services
        </Stack>
        <Stack gap={2}>
          <InteractiveTable<ServiceData>
            data={data.services}
            pageSize={100}
            getRowId={(service: ServiceData) => service.name}
            columns={data.columns}
          />
        </Stack>
      </FieldSet>
      {props.isModal && (
        <Modal.ButtonRow>
          <Button variant="secondary" fill="outline" onClick={data.dismissModal}>
            Cancel
          </Button>
          <Button type="submit" disabled={!data.name || data.isNameInvalid}>
            Add
          </Button>
        </Modal.ButtonRow>
      )}
    </form>
  );
}

function getStyles(theme: GrafanaTheme2) {
  return {
    editRule: css`
      display: flex;
      flex-direction: column;
      gap: theme.spacing(2);
    `,
  };
}
