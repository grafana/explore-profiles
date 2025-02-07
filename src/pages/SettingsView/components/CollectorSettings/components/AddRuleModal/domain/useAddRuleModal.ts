import { DomainHookReturnValueTyped } from '@shared/types/DomainHookReturnValue';
import { useState } from 'react';

import { AddRuleModalProps } from '../AddRuleModal';

export function useAddRuleModal({}: AddRuleModalProps): DomainHookReturnValueTyped<
  {
    isModalOpen: boolean;
  },
  {
    openModal(): void;
    onDismiss(): void;
  }
> {
  const [isModalOpen, setIsModalOpen] = useState(false);

  function closeModal() {
    setIsModalOpen(false);
  }

  return {
    data: {
      isModalOpen,
    },
    actions: {
      openModal() {
        setIsModalOpen(true);
      },
      onDismiss() {
        closeModal();
      },
    },
  };
}
