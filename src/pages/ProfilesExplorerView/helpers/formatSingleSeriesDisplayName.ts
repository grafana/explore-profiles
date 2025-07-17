import { DataFrame, getValueFormat } from '@grafana/data';

import { getSeriesStatsValue } from '../infrastructure/helpers/getSeriesStatsValue';

function isCumulativeMetric(s: DataFrame): boolean {
  const isCumulative = s.meta?.custom?.isCumulative;
  const cumulativeTotal = getSeriesStatsValue(s, 'cumulativeTotal');
  return isCumulative || (cumulativeTotal !== undefined && cumulativeTotal !== null && cumulativeTotal > 0);
}

function getCumulativeDisplayValues(
  s: DataFrame,
  metricFieldUnit: string | undefined
): { value: number; unit: string; label: string } {
  const allValuesSum = getSeriesStatsValue(s, 'allValuesSum') || 0;
  const valueField = s.fields.find((f) => f.type === 'number');
  const dataPointCount = valueField?.values?.length || 1;

  return {
    value: allValuesSum / dataPointCount,
    unit: metricFieldUnit || 'short',
    label: 'avg',
  };
}

function getInstantDisplayValues(
  s: DataFrame,
  metricFieldUnit: string | undefined
): { value: number; unit: string; label: string } {
  return {
    value: getSeriesStatsValue(s, 'allValuesSum') || 0,
    unit: metricFieldUnit || 'short',
    label: 'total',
  };
}

function getSafeUnit(unit: string | undefined): string {
  return unit && unit !== 'none' ? unit : 'short';
}

export function formatSingleSeriesDisplayName(label: string, s: DataFrame) {
  const metricFieldUnit = s.fields[1]?.config?.unit;

  const displayValues = isCumulativeMetric(s)
    ? getCumulativeDisplayValues(s, metricFieldUnit)
    : getInstantDisplayValues(s, metricFieldUnit);

  const safeDisplayUnit = getSafeUnit(displayValues.unit);
  const safeMetricUnit = getSafeUnit(metricFieldUnit);

  const displayFormatted = getValueFormat(safeDisplayUnit)(displayValues.value);
  const maxValue = getSeriesStatsValue(s, 'maxValue') || 0;
  const maxValueFormatted = getValueFormat(safeMetricUnit)(maxValue);

  return `${displayValues.label} ${label} = ${displayFormatted.text}${displayFormatted.suffix} / max = ${maxValueFormatted.text}${maxValueFormatted.suffix}`;
}
