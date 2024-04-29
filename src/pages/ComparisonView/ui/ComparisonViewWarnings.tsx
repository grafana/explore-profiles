import { InlineBanner } from '@shared/components/InlineBanner';
import React from 'react';

type ComparisonViewWarningsProps = {
  noLeftDataAvailable: boolean;
  noRightDataAvailable: boolean;
};
export function ComparisonViewWarnings({ noLeftDataAvailable, noRightDataAvailable }: ComparisonViewWarningsProps) {
  if (!noLeftDataAvailable && !noRightDataAvailable) {
    return null;
  }

  if (noLeftDataAvailable && noRightDataAvailable) {
    return (
      <InlineBanner
        severity="warning"
        title="No timeline data available"
        message="Please verify that you've selected a proper service, profile type and time range."
      />
    );
  }

  if (noLeftDataAvailable && !noRightDataAvailable) {
    return (
      <InlineBanner
        severity="warning"
        title="No timeline baseline data available"
        message="Please verify that you've selected a proper service, profile type and time range."
      />
    );
  }

  if (!noLeftDataAvailable && noRightDataAvailable) {
    return (
      <InlineBanner
        severity="warning"
        title="No comparison timeline data available"
        message="Please verify that you've selected a proper service, profile type and time range."
      />
    );
  }

  return null;
}
