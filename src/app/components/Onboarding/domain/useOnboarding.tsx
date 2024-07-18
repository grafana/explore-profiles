import { ApiClient } from '@shared/infrastructure/http/ApiClient';
import { DomainHookReturnValue } from '@shared/types/DomainHookReturnValue';
import { useState } from 'react';

import { useDataPresentCheck } from '../infrastructure/useDataPresentCheck';

export function useOnboarding(): DomainHookReturnValue {
  const { isFetching, error, hasNoUserData } = useDataPresentCheck();
  const [isModalClosed, setIsModalClosed] = useState(false);
  const noDatasource = ApiClient.datasourcesCount() === 0;

  return {
    data: {
      shouldShowLoadingPage: !error && isFetching,
      shouldShowOnboardingPage: (noDatasource || !error) && !isModalClosed && hasNoUserData,
    },
    actions: {
      closeModal() {
        setIsModalClosed(true);
      },
    },
  };
}
