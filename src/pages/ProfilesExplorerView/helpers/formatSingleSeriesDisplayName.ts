import { DataFrame, getValueFormat } from '@grafana/data';

import { getSeriesStatsValue } from '../infrastructure/helpers/getSeriesStatsValue';

function isRateCalculatedByBackend(s: DataFrame): boolean {
  const rateCalculated = s.meta?.custom?.rateCalculated;
  return Boolean(rateCalculated);
}

export function formatSingleSeriesDisplayName(label: string, s: DataFrame) {
  const metricFieldUnit = s.fields[1]?.config?.unit || 'short';
  const allValuesSum = getSeriesStatsValue(s, 'allValuesSum') || 0;
  const maxValue = getSeriesStatsValue(s, 'maxValue') || 0;

  const isRateCalculated = isRateCalculatedByBackend(s);

  let displayValue: number;
  let displayLabel: string;

  if (isRateCalculated) {
    // Show average of those rate values over the time period
    const valueField = s.fields.find((f) => f.type === 'number');
    const dataPointCount = valueField?.values?.length || 1;
    displayValue = allValuesSum / dataPointCount;
    displayLabel = 'avg';
  } else {
    // For instant profiles, show total
    displayValue = allValuesSum;
    displayLabel = 'total';
  }

  const displayFormatted = getValueFormat(metricFieldUnit)(displayValue);
  const maxValueFormatted = getValueFormat(metricFieldUnit)(maxValue);

  return `${displayLabel} ${label} = ${displayFormatted.text}${displayFormatted.suffix} / max = ${maxValueFormatted.text}${maxValueFormatted.suffix}`;
}
