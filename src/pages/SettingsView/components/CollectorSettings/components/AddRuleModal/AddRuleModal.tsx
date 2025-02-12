// a modal for adding a new rule
import { UpsertCollectionRuleRequest } from '@shared/pyroscope-api/settings/v1/setting_pb';
import { Button, Modal } from '@grafana/ui';
import React from 'react';

import { EditRule } from '../EditRule/EditRule';
import { useAddRuleModal } from './domain/useAddRuleModal';

export type AddRuleModalProps = {
  saveRule(rule: UpsertCollectionRuleRequest): Promise<void>;
  existingRuleNames: string[];
};

export function AddRuleModal(props: AddRuleModalProps) {
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
        onDismiss={actions.onDismiss}
      >
        <EditRule
          onSubmit={actions.onDismiss}
          onDismiss={actions.onDismiss}
          saveRule={props.saveRule}
          existingRuleNames={props.existingRuleNames}
        />
      </Modal>
    </>
  );
}
