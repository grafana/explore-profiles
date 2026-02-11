import { getProfileMetric, ProfileMetricId } from '@shared/infrastructure/profile-metrics/getProfileMetric';
import { logger } from '@shared/infrastructure/tracking/logger';

import { PyroscopeSeries } from './SeriesApiClient';

type Labels = Array<{ name: string; value: string }>;

function findServiceNameAndProfileMetricId(labels: Labels) {
  let serviceName;
  let profileMetricId;

  for (const { name, value } of labels) {
    if (name === 'service_name') {
      serviceName = value;
    }

    if (name === '__profile_type__') {
      profileMetricId = value;
    }

    if (serviceName && profileMetricId) {
      return [serviceName, profileMetricId];
    }
  }

  return [];
}

/**
 * Encodes a value for use in a composite key.
 * Uses URL encoding to handle any UTF-8 character including "/".
 */
export function encodeCompositeValue(value: string): string {
  return encodeURIComponent(value);
}

/**
 * Decodes a value from a composite key.
 */
export function decodeCompositeValue(encoded: string): string {
  return decodeURIComponent(encoded);
}

/**
 * Joins multiple label values into a composite value using "/" as delimiter.
 * Each value is URL-encoded to handle special characters including "/".
 */
export function joinCompositeValues(values: string[]): string {
  return values.map(encodeCompositeValue).join('/');
}

/**
 * Splits a composite value back into individual label values.
 * Each value is URL-decoded.
 */
export function splitCompositeValue(compositeValue: string): string[] {
  return compositeValue.split('/').map(decodeCompositeValue);
}

/**
 * Extracts values for the preset labels from a label set and joins them with "/"
 * Returns [compositeValue, profileMetricId] or empty array if required labels are missing
 */
function findCompositeValueAndProfileMetricId(labels: Labels, presetLabels: string[]): [string, string] | [] {
  const labelMap = new Map<string, string>();

  for (const { name, value } of labels) {
    labelMap.set(name, value);
  }

  const profileMetricId = labelMap.get('__profile_type__');
  if (!profileMetricId) {
    return [];
  }

  // Extract values for all preset labels in order
  const values: string[] = [];
  for (const labelName of presetLabels) {
    const value = labelMap.get(labelName);
    if (value === undefined) {
      // If any preset label is missing, skip this label set
      return [];
    }
    values.push(value);
  }

  // Join with "/" to create composite value (each value is URL-encoded)
  const compositeValue = joinCompositeValues(values);
  return [compositeValue, profileMetricId];
}

export function formatSeriesResponse(data: { labelsSet: Array<{ labels: Labels }> }): PyroscopeSeries {
  const services: PyroscopeSeries['services'] = new Map();
  const profileMetrics: PyroscopeSeries['profileMetrics'] = new Map();

  if (!data.labelsSet) {
    logger.warn('Pyroscope SeriesApiClient: no data received!');
    return { services, profileMetrics };
  }

  for (const { labels } of data.labelsSet) {
    const [serviceName, profileMetricId] = findServiceNameAndProfileMetricId(labels);

    if (!serviceName || !profileMetricId) {
      logger.warn(
        'Pyroscope ServicesApiClient: "service_name" and/or "__profile_type__" are missing in the labels received!',
        labels
      );
      continue;
    }

    const serviceProfileMetrics = services.get(serviceName) || new Map();
    serviceProfileMetrics.set(profileMetricId, getProfileMetric(profileMetricId as ProfileMetricId));
    services.set(serviceName, serviceProfileMetrics);

    const profileMetricServices = profileMetrics.get(profileMetricId) || new Set();
    profileMetricServices.add(serviceName);
    profileMetrics.set(profileMetricId, profileMetricServices);
  }

  return { services, profileMetrics };
}

function addToSeriesMaps(
  services: PyroscopeSeries['services'],
  profileMetrics: PyroscopeSeries['profileMetrics'],
  compositeValue: string,
  profileMetricId: string
) {
  const serviceProfileMetrics = services.get(compositeValue) || new Map();
  serviceProfileMetrics.set(profileMetricId, getProfileMetric(profileMetricId as ProfileMetricId));
  services.set(compositeValue, serviceProfileMetrics);

  const profileMetricServices = profileMetrics.get(profileMetricId) || new Set();
  profileMetricServices.add(compositeValue);
  profileMetrics.set(profileMetricId, profileMetricServices);
}

/**
 * Formats series response using a label preset.
 * Creates composite values by joining preset label values with "/".
 * For example, with presetLabels=['cluster', 'namespace', 'container'],
 * creates values like "prod-cluster/my-namespace/my-container".
 */
export function formatSeriesResponseWithPreset(
  data: { labelsSet: Array<{ labels: Labels }> },
  presetLabels: string[]
): PyroscopeSeries {
  const services: PyroscopeSeries['services'] = new Map();
  const profileMetrics: PyroscopeSeries['profileMetrics'] = new Map();

  if (!data.labelsSet) {
    logger.warn('Pyroscope SeriesApiClient: no data received!');
    return { services, profileMetrics };
  }

  for (const { labels } of data.labelsSet) {
    const result = findCompositeValueAndProfileMetricId(labels, presetLabels);

    if (result.length === 0) {
      continue;
    }

    const [compositeValue, profileMetricId] = result;
    addToSeriesMaps(services, profileMetrics, compositeValue, profileMetricId);
  }

  return { services, profileMetrics };
}
