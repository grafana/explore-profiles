import { Alert } from '@grafana/ui';
import React from 'react';

type ErrorBoxProps = {
  title: string;
  error: Error;
};
export function ErrorMessage({ title, error }: ErrorBoxProps) {
  console.error(title);
  console.error(error);

  return (
    <Alert title={title} severity="error">
      {error.toString()}
    </Alert>
  );
}
