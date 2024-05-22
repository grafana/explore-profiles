import { translatePyroscopeTimeRangeToGrafana } from '@shared/domain/translation';
import { useFetchServices } from '@shared/infrastructure/services/useFetchServices';

// import { useFetchTenantStats } from './useFetchTenantStats';

export function useDataPresentCheck() {
  const { isFetching, error, services } = useFetchServices({
    timeRange: translatePyroscopeTimeRangeToGrafana('', ''),
  });

  // TODO: switch when the new API endpoint is available everywhere
  // const { isFetching, error, stats } = useFetchTenantStats();

  return {
    isFetching,
    hasNoUserData: !isFetching && !services.size,
    // hasNoUserData: !isFetching && !stats?.hasIngestedData,
    error: Boolean(error),
  };
}
