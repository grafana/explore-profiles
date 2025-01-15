import { IconName } from '@grafana/data';
import { Props as FlameGraphProps } from '@grafana/flamegraph';
import { DomainHookReturnValue } from '@shared/types/DomainHookReturnValue';

export function useExportedMetricsMenu(): DomainHookReturnValue {
  const getExtraFlameGraphMenuItems: FlameGraphProps['getExtraContextMenuButtons'] = ({ item }: any) => {
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
        onClick: () => {},
      },
    ];
  };

  return {
    data: {},
    actions: {
      getExtraFlameGraphMenuItems,
    },
  };
}
