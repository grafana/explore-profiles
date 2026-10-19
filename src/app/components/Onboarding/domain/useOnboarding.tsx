import { usePyroscopeDataSources } from '@shared/infrastructure/datasource/useSelectDefaultDataSourceUid';
import { DomainHookReturnValue } from '@shared/types/DomainHookReturnValue';
import { useState } from 'react';

import { useFetchTenantStats } from '../infrastructure/useFetchTenantStats';

export function useOnboarding(): DomainHookReturnValue {
  const { datasources, error: dsError, loading: dsLoading } = usePyroscopeDataSources();
  const [isModalClosed, setIsModalClosed] = useState(false);

  const pyroscopeDataSourcesCount = datasources?.length ?? 0;
  const { isFetching, error, stats } = useFetchTenantStats({ enabled: pyroscopeDataSourcesCount > 0 });
  const hasNoUserData = !isFetching && !stats?.hasIngestedData;

  return {
    data: {
      shouldShowLoadingPage: !error && !dsError && (isFetching || dsLoading),
      shouldShowOnboardingPage: (error || dsError || !pyroscopeDataSourcesCount || hasNoUserData) && !isModalClosed,
      shouldShowNoDataSourceBanner: !pyroscopeDataSourcesCount,
    },
    actions: {
      closeModal() {
        setIsModalClosed(true);
      },
    },
  };
}
