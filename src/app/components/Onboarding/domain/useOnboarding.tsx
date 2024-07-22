import { ApiClient } from '@shared/infrastructure/http/ApiClient';
import { DomainHookReturnValue } from '@shared/types/DomainHookReturnValue';
import { useState } from 'react';

import { useFetchTenantStats } from '../infrastructure/useFetchTenantStats';

export function useOnboarding(): DomainHookReturnValue {
  const [isModalClosed, setIsModalClosed] = useState(false);

  const pyroscopeDataSourcesCount = ApiClient.getPyroscopeDataSources().length;
  const { isFetching, error, stats } = useFetchTenantStats({ enabled: pyroscopeDataSourcesCount > 0 });
  const hasNoUserData = !isFetching && !stats?.hasIngestedData;

  return {
    data: {
      shouldShowLoadingPage: !error && isFetching,
      shouldShowOnboardingPage: (error || !pyroscopeDataSourcesCount || hasNoUserData) && !isModalClosed,
      shouldShowNoDataSourceBanner: !pyroscopeDataSourcesCount,
    },
    actions: {
      closeModal() {
        setIsModalClosed(true);
      },
    },
  };
}
