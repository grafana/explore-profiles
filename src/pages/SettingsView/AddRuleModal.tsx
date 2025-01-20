// a modal for adding a new rule
import { css } from '@emotion/css';
import { GrafanaTheme2 } from '@grafana/data';
import { Button, ConfirmModal, Field, FieldSet, Input, Stack, useStyles2 } from '@grafana/ui';
import React, { useState } from 'react';

type AddRuleModalProps = {
  onRuleAdd(name: string): void;
};

const RULE_NAME_ERROR_MESSAGE =
  'Rule name is not valid, it must consist of one or more alphanumeric characters (a through z lower-case), digits or hyphens.';
const validateRuleName = (name: string): string | boolean => {
  const regex = /^[a-z0-9\-]+$/;
  return regex.test(name) || RULE_NAME_ERROR_MESSAGE;
};

export function AddRuleModal({ onRuleAdd }: AddRuleModalProps) {
  const [showModal, setShowModal] = useState<boolean>(false);

  const [validName, setValidName] = useState<string | boolean>(true);
  const [name, setName] = useState<string>();

  const styles = useStyles2(getStyles);

  function onNameChange(event: React.ChangeEvent<HTMLInputElement>) {
    onNameValue(event.currentTarget.value);
  }
  function onNameValue(ruleName: string) {
    setName(ruleName);
    setValidName(validateRuleName(ruleName));
  }
  return (
    <Stack gap={5} alignItems="flex-end" justifyContent="end">
      <Button icon={'plus'} onClick={() => setShowModal(true)}>
        Add rule
      </Button>
      {showModal && (
        <ConfirmModal
          isOpen
          title={`Add new rule`}
          body={
            <FieldSet className={styles.ct}>
              <Field
                invalid={validName !== true}
                error={validName !== true ? validName : ''}
                label="Rule name"
                className={styles.name}
              >
                <Input name="rule_name" onChange={onNameChange} placeholder="Add the rule name" />
              </Field>
            </FieldSet>
          }
          confirmText={'Add'}
          confirmButtonVariant="primary"
          onConfirm={() => {
            if (name !== undefined) {
              onRuleAdd(name);
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
    </Stack>
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
