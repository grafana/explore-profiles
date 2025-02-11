import { usePageInitialized } from '@shared/infrastructure/tracking/usePageInitialized';
import { PageTitle } from '@shared/ui/PageTitle';
import React from 'react';

import { AdHocTabs } from './ui/AdHocTabs';

export default function AdHocView() {
  usePageInitialized('ad_hoc');
  return (
    <>
      <PageTitle title="Ad hoc view" />
      <AdHocTabs />
    </>
  );
}
