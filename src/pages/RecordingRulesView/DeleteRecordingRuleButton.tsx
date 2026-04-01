import { t } from '@grafana/i18n';
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
        aria-label={t('recording-rules.delete.aria-label', 'Delete recording rule')}
      />
      <ConfirmModal
        isOpen={isOpen}
        title={t('recording-rules.delete.title', 'Delete recording rule')}
        body={t('recording-rules.delete.body', `Are you sure you want to delete {{metricName}} recording rule?`, {
          metricName: rule.metricName,
        })}
        confirmText={t('recording-rules.delete.confirm', 'Yes')}
        onConfirm={() => {
          confirm();
          setIsOpen(false);
        }}
        onDismiss={() => setIsOpen(false)}
      />
    </>
  );
}
