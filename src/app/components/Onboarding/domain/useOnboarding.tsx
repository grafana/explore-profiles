import { DomainHookReturnValue } from '@shared/types/DomainHookReturnValue';
import { useState } from 'react';

import { useCheckForUserData } from '../infrastructure/useCheckForUserData';

export function useOnboarding(): DomainHookReturnValue {
  const [isModalClosed, setIsModalClosed] = useState(false);

  const { isFetching, error, hasNoUserData } = useCheckForUserData();

  const shouldShowEmptyLoadingPage = isFetching && !error;

  const shouldShowOnboardingPage = hasNoUserData && !error && !isModalClosed;

  return {
    data: {
      shouldShowEmptyLoadingPage,
      shouldShowOnboardingPage,
    },
    actions: {
      closeModal() {
        setIsModalClosed(true);
      },
    },
  };
}
