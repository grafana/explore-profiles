import { IconName } from '@grafana/data';
import { Props as FlameGraphProps } from '@grafana/flamegraph';
import { DomainHookReturnValue } from '@shared/types/DomainHookReturnValue';
import { useCallback } from 'react';

export function useCreateRecordingRulesMenu(setModalOpen: (functionName?: string) => void): DomainHookReturnValue {
  const getExtraFlameGraphMenuItems: FlameGraphProps['getExtraContextMenuButtons'] = useCallback(
    ({ item, label }: any) => {
      return [
        {
          label: 'Create recording rule',
          icon: 'download-alt' as IconName,
          onClick: () => setModalOpen(label === 'total' && item.level === 0 ? undefined : label),
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
