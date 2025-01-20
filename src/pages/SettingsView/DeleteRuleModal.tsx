import { ConfirmModal, IconButton } from '@grafana/ui';
import React, { useState } from 'react';

type Props = {
  ruleName: string;
  onRuleDelete: (ruleName: string) => Promise<void>;
};

export const DeleteRuleModal = ({ onRuleDelete, ruleName }: Props) => {
  const [showModal, setShowModal] = useState<boolean>(false);

  const body = (
    <>
      <div>
        Deleting this rule is permanent and cannot be undone. Existing deployed pipelines will remain in the
        fleet-management app.
      </div>
    </>
  );

  return (
    <>
      <IconButton key="delete" onClick={() => setShowModal(true)} name="trash-alt" tooltip="Delete this rule" />
      <ConfirmModal
        isOpen={showModal}
        title={`Delete rule '${ruleName}'`}
        body={body}
        confirmText="Delete"
        onConfirm={() => {
          onRuleDelete(ruleName);
          setShowModal(false);
        }}
        onDismiss={() => setShowModal(false)}
        confirmButtonVariant="destructive"
        dismissVariant="secondary"
      />
    </>
  );
};
