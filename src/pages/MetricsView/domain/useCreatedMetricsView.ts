export interface Metric {
  name: string;
  profileType: string;
  labels: string[];
  filter: string;
  dataSource: string;
}

export function useCreatedMetricsView() {
  // TODO: Ultimately this will fetch the configurations from the backend. This
  // will include the readonly configs.

  const metrics: Metric[] = [
    {
      name: 'pyroscope_rideshare_cpu',
      profileType: 'process_cpu/cpu',
      labels: ['service_name', 'vehicle'],
      filter: '{__profile_type__ = "process::cpu::cpu_nanoseconds", service_name = "rideshare"}',
      dataSource: 'ops-cortex',
    },
    {
      name: 'pyroscope_all_cpu',
      profileType: 'process_cpu/cpu',
      labels: [],
      filter: '{__profile_type__ = "process::cpu::cpu_nanoseconds"}',
      dataSource: 'ops-cortex',
    },
    {
      name: 'pyroscope_profiles_dev_002_query_frontend_alloc_objects',
      profileType: 'memory/alloc_objects',
      labels: [
        '__name__',
        '__period_type__',
        '__period_unit__',
        '__profile_type__',
        '__service_name__',
        '__type__',
        '__unit__',
        'apps_kubernetes_io_pod_index',
        'cluster',
        'container',
        'controller_revision_hash',
        'gossip_ring_member',
        'instance',
        'job',
        'name',
        'namespace',
        'node',
        'pod',
        'service_name',
        'statefulset_kubernetes_io_pod_name',
      ],
      filter:
        '{__profile_type__="memory::alloc_objects",__service_name__="profiles-dev-002/query-frontend",cluster="dev",namespace="profiles-dev-002"}',
      dataSource: 'ops-cortex',
    },
  ];

  return {
    data: {
      metrics,
      fetchError: null,
    },
    actions: {},
  };
}
