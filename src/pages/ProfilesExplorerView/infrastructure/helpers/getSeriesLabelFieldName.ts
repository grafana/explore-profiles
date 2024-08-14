import { Field } from '@grafana/data';

export const getSeriesLabelFieldName = (metricField: Field, label?: string) =>
  metricField.labels?.[label as string] || metricField.name;
