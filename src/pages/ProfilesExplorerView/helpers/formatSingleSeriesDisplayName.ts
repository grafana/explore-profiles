import { DataFrame, getValueFormat } from '@grafana/data';

import { getSeriesStatsValue } from '../infrastructure/helpers/getSeriesStatsValue';

export function formatSingleSeriesDisplayName(label: string, s: DataFrame) {
  const metricFieldUnit = s.fields[1].config.unit;

  const allValuesSum = getSeriesStatsValue(s, 'allValuesSum') || 0;
  const allValuesSumFormatted = getValueFormat(metricFieldUnit)(allValuesSum);

  const maxValue = getSeriesStatsValue(s, 'maxValue') || 0;
  const maxValueFormatted = getValueFormat(metricFieldUnit)(maxValue);

  return `total ${label} = ${allValuesSumFormatted.text}${allValuesSumFormatted.suffix} / max = ${maxValueFormatted.text}${maxValueFormatted.suffix}`;
}
