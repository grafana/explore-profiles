import { MetricFindValue } from '@grafana/data';
import { localeCompare } from '@shared/domain/localeCompare';

import { splitCompositeValue } from './http/formatSeriesResponse';
import { PyroscopeSeries } from './http/SeriesApiClient';

/**
 * Decodes a composite value for display purposes.
 * Splits the URL-encoded composite and joins with " / " for readability.
 */
function decodeForDisplay(compositeValue: string): string {
  try {
    return splitCompositeValue(compositeValue).join(' / ');
  } catch {
    // If decoding fails, return as-is
    return compositeValue;
  }
}

export function formatSeriesToServices(pyroscopeSeries: PyroscopeSeries, profileMetricId?: string): MetricFindValue[] {
  if (profileMetricId) {
    const servicesSet = pyroscopeSeries.profileMetrics.get(profileMetricId) || new Set();

    return Array.from(servicesSet)
      .sort(localeCompare)
      .map((compositeValue) => ({
        text: decodeForDisplay(compositeValue),
        value: compositeValue,
      }));
  }

  return Array.from(pyroscopeSeries.services.keys())
    .sort(localeCompare)
    .map((compositeValue) => ({
      text: decodeForDisplay(compositeValue),
      value: compositeValue,
    }));
}
