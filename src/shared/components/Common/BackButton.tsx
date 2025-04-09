import { Button } from '@grafana/ui';
import React from 'react';

export function BackButton({ onClick }: { onClick?: () => void }) {
  const callback = onClick ? onClick : () => history.back();
  return (
    <Button variant="secondary" onClick={callback} aria-label="Back to Profiles Drilldown">
      Back to Profiles Drilldown
    </Button>
  );
}
