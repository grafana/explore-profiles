import { Button } from '@grafana/ui';
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
      <Button variant="secondary" onClick={() => history.back()} aria-label="Back to Profiles Drilldown">
        Back to Profiles Drilldown
      </Button>
    </>
  );
}
