import { useFetchTenantStats } from './useFetchTenantStats';

export function useDataPresentCheck() {
  const { isFetching, error, stats } = useFetchTenantStats();

  return {
    isFetching,
    hasNoUserData: !isFetching && !stats?.hasIngestedData,
    error: Boolean(error),
  };
}
