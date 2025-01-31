// a modal for adding a new rule
import { UpsertCollectionRuleRequest } from '@buf/pyroscope_api.bufbuild_es/settings/v1/setting_pb';
import { Button, Modal } from '@grafana/ui';
import React from 'react';

import { EditRule } from '../EditRule/EditRule';
import { useAddRuleModal } from './domain/useAddRuleModal';

export type AddRuleModalProps = {
  saveRule(rule: UpsertCollectionRuleRequest): void;
};

const RULE_NAME_ERROR_MESSAGE = 'Please enter a valid rule name. It can contain lowercase letters, digits or hyphens.';

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
        onDismiss={actions.dismissModal}
      >
        <form onSubmit={actions.addRule}>
          <EditRule isModal={true} saveRule={props.saveRule} />
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
