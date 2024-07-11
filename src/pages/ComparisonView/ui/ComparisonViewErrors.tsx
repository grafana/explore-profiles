import { InlineBanner } from '@shared/ui/InlineBanner';
import React from 'react';

type ComparisonViewErrorsProps = {
  leftTimelineError?: Error;
  rightTimelineError?: Error;
};

export function ComparisonViewErrors({ leftTimelineError, rightTimelineError }: ComparisonViewErrorsProps) {
  if (!leftTimelineError && !rightTimelineError) {
    return null;
  }

  if (leftTimelineError && rightTimelineError) {
    return (
      <InlineBanner
        severity="error"
        title="Error while loading timeline data!"
        errors={[leftTimelineError, rightTimelineError]}
      />
    );
  }

  if (leftTimelineError && !rightTimelineError) {
    return (
      <InlineBanner severity="error" title="Error while loading baseline timeline data!" errors={[leftTimelineError]} />
    );
  }

  if (!leftTimelineError && rightTimelineError) {
    return (
      <InlineBanner
        severity="error"
        title="Error while loading comparison timeline data!"
        errors={[rightTimelineError]}
      />
    );
  }

  return null;
}
