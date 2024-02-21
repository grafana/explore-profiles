import { useQuery } from '@tanstack/react-query';

export function useFetchInstances() {
  const { isFetching, error, data } = useQuery({
    queryKey: ['instances'],
    queryFn: () =>
      fetch('/api/plugin-proxy/cloud-home-app/grafanacom-api/instances').then((response) => response.json()),
  });

  return {
    isFetching,
    error,
    instances: data,
  };
}
