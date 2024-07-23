import { DataQueryError } from '@grafana/data';

export function getDataSourceError(errors?: DataQueryError[]) {
  console.error('Data source errors');
  console.error(errors);

  return new Error(errors?.[0].message || 'Unknown error');
}
