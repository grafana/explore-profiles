import { PageTitle } from '@shared/ui/PageTitle';
import React from 'react';

import { AdHocTabs } from './ui/AdHocTabs';

export function AdHocView() {
  return (
    <>
      <PageTitle title="Ad hoc view" />
      <AdHocTabs />
    </>
  );
}
