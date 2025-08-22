import { useQuery } from '@tanstack/react-query';
import { PLUGIN_API_URL } from 'src/constants';

export function useFetchInstances() {
  const { isFetching, error, data } = useQuery({
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
