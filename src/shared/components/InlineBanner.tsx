import { Alert, AlertVariant } from '@grafana/ui';
import React from 'react';

type InlineBannerProps = {
  severity: AlertVariant;
  title: string;
  message?: string;
  errors?: Error[];
};

export function InlineBanner({ severity, title, message, errors }: InlineBannerProps) {
  if (errors) {
    console.error(title);
    console.error(errors);
  }

  return (
    <Alert title={title} severity={severity}>
      {errors?.map((e) => (
        <>
          {e.message}
          <br />
        </>
      ))}
      {message}
    </Alert>
  );
}
