import { Alert, AlertVariant } from '@grafana/ui';
import React from 'react';

type InlineBannerProps = {
  severity: AlertVariant;
  title: string;
  message?: string;
  error?: Error;
};

export function InlineBanner({ severity, title, message, error }: InlineBannerProps) {
  if (error) {
    console.error(title);
    console.error(error);
  }

  return (
    <Alert title={title} severity={severity}>
      {error ? error.message : null}
      {error && message ? <br /> : null}
      {message}
    </Alert>
  );
}
