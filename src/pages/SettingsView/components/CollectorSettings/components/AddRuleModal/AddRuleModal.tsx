// a modal for adding a new rule
import { css } from '@emotion/css';
import { GrafanaTheme2 } from '@grafana/data';
import { Button, Field, FieldSet, Input, Modal, useStyles2 } from '@grafana/ui';
import React from 'react';

import { useAddRuleModal } from './domain/useAddRuleModal';

export type AddRuleModalProps = {
  onAddRule(name: string): void;
};

const RULE_NAME_ERROR_MESSAGE = 'Please enter a valid rule name. It can contain lowercase letters, digits or hyphens.';

export function AddRuleModal(props: AddRuleModalProps) {
  const styles = useStyles2(getStyles);
  const { data, actions } = useAddRuleModal(props);

  return (
    <>
      <Button icon="plus" onClick={() => actions.openModal()}>
        Add rule
      </Button>

      <Modal
        title="Add new rule"
        isOpen={data.isModalOpen}
        closeOnEscape={true}
        closeOnBackdropClick={true}
        onDismiss={actions.dismissModal}
      >
        <form onSubmit={actions.addRule}>
          <FieldSet className={styles.modalBody}>
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
          </FieldSet>
          <Modal.ButtonRow>
            <Button variant="secondary" fill="outline" onClick={data.dismissModal}>
              Cancel
            </Button>
            <Button type="submit" disabled={!data.name || data.isNameInvalid}>
              Add
            </Button>
          </Modal.ButtonRow>
        </form>
      </Modal>
    </>
  );
}

function getStyles(theme: GrafanaTheme2) {
  return {
    modalBody: css`
      display: flex;
      flex-direction: column;
      gap: theme.spacing(2);
    `,
    iconError: css`
      height: 32px;
      align-self: center;
      color: ${theme.colors.error.text};
    `,
  };
}
