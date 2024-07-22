import React from 'react';

import { useOnboarding } from './domain/useOnboarding';
import { EmptyLoadingPage } from './ui/EmptyLoadingPage';
import { NoDataSourcePage } from './ui/NoDataSourcePage';
import { OnboardingPage } from './ui/OnboardingPage';

type OnboardingProps = {
  children: React.ReactNode;
};

/**
 * Displays an onboarding dialog instructing how to push data only when data is not present
 */
export function Onboarding({ children }: OnboardingProps) {
  const { data, actions } = useOnboarding();

  if (data.shouldShowLoadingPage) {
    return <EmptyLoadingPage />;
  }

  if (data.shouldShowOnboardingPage) {
    return <OnboardingPage onCloseModal={actions.closeModal} />;
  }

  if (data.shouldShowNoDataSourceBanner) {
    return <NoDataSourcePage />;
  }

  return <>{children}</>;
}
