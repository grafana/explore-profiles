import { Spinner } from '@grafana/ui';
import React, { memo } from 'react';

type InlineSpinnerProps = {
  isLoading: boolean;
  children: React.ReactNode;
};

function InlineSpinnerComponent({ isLoading, children }: InlineSpinnerProps) {
  return isLoading ? <Spinner inline /> : <>{children}</>;
}

export const InlineSpinner = memo(InlineSpinnerComponent);
