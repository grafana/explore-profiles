import { Field } from '@grafana/data';

export const getSeriesLabelFieldName = (metricField: Field, label?: string) =>
  metricField.labels?.[label as string] || metricField.name; // metricField.labels can be empty when the ingested profiles do not have a label value set
