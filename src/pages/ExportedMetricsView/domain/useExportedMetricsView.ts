import { DomainHookReturnValue } from '@shared/types/DomainHookReturnValue';

export function useExportedMetricsView(): DomainHookReturnValue {
  return {
    data: {
      metrics: [
        {
          name: 'Rideshare CPU',
          profileType: 'process::cpu::cpu_nanoseconds',
          exportedLabels: ['service_name', 'vehicle'],
          filter: '{__profile_type__ = "process::cpu::cpu_nanoseconds", service_name = "rideshare"}',
        },
        {
          name: 'All CPU',
          profileType: 'process::cpu::cpu_nanoseconds',
          exportedLabels: [],
          filter: '{__profile_type__ = "process::cpu::cpu_nanoseconds"}',
        },
      ],
      fetchError: null,
    },
    actions: {},
  };
}
