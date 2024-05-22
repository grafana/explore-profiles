import { DomainHookReturnValue } from '@shared/types/DomainHookReturnValue';
import { useState } from 'react';

import { useDataPresentCheck } from '../infrastructure/useDataPresentCheck';

export function useOnboarding(): DomainHookReturnValue {
  const { isFetching, error, hasNoUserData } = useDataPresentCheck();
  const [isModalClosed, setIsModalClosed] = useState(false);

  return {
    data: {
      shouldShowLoadingPage: !error && isFetching,
      shouldShowOnboardingPage: !error && !isModalClosed && hasNoUserData,
    },
    actions: {
      closeModal() {
        setIsModalClosed(true);
      },
    },
  };
}
