import { IconName } from '@grafana/data';
import { Props as FlameGraphProps } from '@grafana/flamegraph';
import { DomainHookReturnValue } from '@shared/types/DomainHookReturnValue';
import { useCallback, useState } from 'react';

export function useCreateMetricsMenu(setModalOpen: () => void): DomainHookReturnValue {
  const getExtraFlameGraphMenuItems: FlameGraphProps['getExtraContextMenuButtons'] = useCallback(
    ({ item }: any) => {
      // NOTE(bryanhuhta): For now, only enable export metrics when clicking on
      // the root node. Eventually this can be removed when we support exporting
      // metrics for functions.
      if (item.level !== 0) {
        return [];
      }

      return [
        {
          label: 'Export metric',
          icon: 'download-alt' as IconName,
          onClick: setModalOpen,
        },
      ];
    },
    [setModalOpen]
  );

  return {
    data: {},
    actions: {
      getExtraFlameGraphMenuItems,
    },
  };
}

type ToggleModal = {
  isModalOpen: () => boolean;
  open: () => void;
  close: () => void;
};

export function useToggleExportMetricModal(): ToggleModal {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return {
    isModalOpen: () => isModalOpen,
    open: () => setIsModalOpen(true),
    close: () => setIsModalOpen(false),
  };
}
