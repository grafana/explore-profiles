import { IconName } from '@grafana/data';
import { Props as FlameGraphProps } from '@grafana/flamegraph';
import { DomainHookReturnValue } from '@shared/types/DomainHookReturnValue';
import { useCallback } from 'react';

export function useCreateRecordingRulesMenu(setModalOpen: () => void): DomainHookReturnValue {
  const getExtraFlameGraphMenuItems: FlameGraphProps['getExtraContextMenuButtons'] = useCallback(
    ({ item }: any) => {
      // NOTE(bryanhuhta): For now, only enable creating recording rules when
      // clicking on the root node. Eventually this can be removed when we
      // support creating recording rules for functions.
      if (item.level !== 0) {
        return [];
      }

      return [
        {
          label: 'Create recording rule',
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
