import React from 'react';

import { AdHocColumns } from '../AdHocColums';
import { AdHocSingle } from './AdHocSingle';

export function AdHocComparison() {
  return <AdHocColumns left={<AdHocSingle />} right={<AdHocSingle />} />;
}
