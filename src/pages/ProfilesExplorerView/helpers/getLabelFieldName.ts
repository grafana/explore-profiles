import { Field } from '@grafana/data';

export const getLabelFieldName = (metricField: Field, label?: string) =>
  metricField.labels?.[label as string] || metricField.name;
