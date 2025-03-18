import { BackButton } from '@shared/components/Common/BackButton';
import { useReportPageInitialized } from '@shared/infrastructure/tracking/useReportPageInitialized';
import { PageTitle } from '@shared/ui/PageTitle';
import React from 'react';

import { AdHocTabs } from './ui/AdHocTabs';

export default function AdHocView() {
  useReportPageInitialized('ad_hoc');
  return (
    <>
      <PageTitle title="Ad hoc view" />
      <AdHocTabs />
      <BackButton />
    </>
  );
}
