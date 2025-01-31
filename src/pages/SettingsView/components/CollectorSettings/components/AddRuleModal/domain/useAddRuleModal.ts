import { DomainHookReturnValue } from '@shared/types/DomainHookReturnValue';
import { debounce } from 'lodash';
import { useState } from 'react';

import { AddRuleModalProps } from '../AddRuleModal';

const validateRuleName = (name: string): boolean => /^[a-z0-9\-]+$/.test(name);

export function useAddRuleModal({}: AddRuleModalProps): DomainHookReturnValue {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isNameInvalid, setIsNameInvalid] = useState(false);
  const [name, setName] = useState('');

  function closeModal() {
    setIsModalOpen(false);
    setName('');
    setIsNameInvalid(true);
  }

  return {
    data: {
      isModalOpen,
      isNameInvalid,
      name,
    },
    actions: {
      openModal() {
        setIsModalOpen(true);
        setName('');
        setIsNameInvalid(true);
      },
      dismissModal() {
        closeModal();
      },
      updateName: debounce((event: React.ChangeEvent<HTMLInputElement>) => {
        const newName = event.target.value;
        setName(newName);
        setIsNameInvalid(!validateRuleName(newName));
      }, 250),
      addRule() {
        if (name && !isNameInvalid) {
          closeModal();
        }
      },
    },
  };
}
