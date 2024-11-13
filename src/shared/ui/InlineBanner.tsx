import { Alert, AlertVariant } from '@grafana/ui';
import { ErrorContext, logger } from '@shared/infrastructure/tracking/logger';
import React from 'react';

type InlineBannerProps = {
  severity: AlertVariant;
  title: string;
  message?: string | React.ReactNode;
  error?: Error;
  errorContext?: ErrorContext;
};

export function InlineBanner({ severity, title, message, error, errorContext }: InlineBannerProps) {
  if (error) {
    logger.error(error, errorContext);
  }

  return (
    <Alert title={title} severity={severity}>
      {error && (
        <>
          {error.message}
          <br />
        </>
      )}
      {message}
    </Alert>
  );
}
