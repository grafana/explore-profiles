import { useQuery } from '@tanstack/react-query';
import { PLUGIN_API_URL } from 'src/constants';

export function useFetchInstances(enabled = true) {
  const { isFetching, error, data } = useQuery({
    enabled,
    queryKey: ['instances'],
    queryFn: () =>
      fetch(`${PLUGIN_API_URL}/grafanacom-api/instances`).then((response) => response.json()),
  });

  return {
    isFetching,
    error,
    instances: data,
  };
}
