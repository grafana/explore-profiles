import { t } from '@grafana/i18n';
import { BackButton } from '@shared/components/Common/BackButton';
import { useReportPageInitialized } from '@shared/infrastructure/tracking/useReportPageInitialized';
import { PageTitle } from '@shared/ui/PageTitle';
import React from 'react';

import { AdHocTabs } from './ui/AdHocTabs';

export default function AdHocView() {
  useReportPageInitialized('ad_hoc');
  return (
    <>
      <PageTitle title={t('ad-hoc.view.title', 'Ad hoc view')} />
      <AdHocTabs />
      <BackButton />
    </>
  );
}
