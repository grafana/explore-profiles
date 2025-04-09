import { ConfirmModal, IconButton } from '@grafana/ui';
import { RecordingRuleViewModel } from '@shared/types/RecordingRuleViewModel';
import React from 'react';

type Props = {
  rule: RecordingRuleViewModel;
  confirm: () => void;
};

export function DeleteRecordingRuleButton({ rule, confirm }: Props) {
  const [isOpen, setIsOpen] = React.useState(false);
  return (
    <>
      <IconButton
        name="trash-alt"
        onClick={() => setIsOpen(true)}
        variant="destructive"
        aria-label="Delete recording rule"
      />
      <ConfirmModal
        isOpen={isOpen}
        title={'Delete recording rule'}
        body={`Are you sure you want to delete ${rule.metricName} recording rule?`}
        confirmText="Yes"
        onConfirm={() => {
          confirm();
          setIsOpen(false);
        }}
        onDismiss={() => setIsOpen(false)}
      />
    </>
  );
}
