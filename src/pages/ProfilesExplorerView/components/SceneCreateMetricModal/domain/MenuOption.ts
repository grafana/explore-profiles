import { useState } from 'react';

type ToggleModal = {
  isModalOpen: () => boolean;
  open: () => void;
  close: () => void;
};

export function useCreateMetricModal(): ToggleModal {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return {
    isModalOpen: () => isModalOpen,
    open: () => setIsModalOpen(true),
    close: () => setIsModalOpen(false),
  };
}
