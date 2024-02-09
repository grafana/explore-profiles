import { getProfileMetric, ProfileMetricId } from '@shared/infrastructure/profile-metrics/getProfileMetric';
import { Services } from '@shared/infrastructure/services/servicesApiClient';

function findMostSuitableProfileType(profileTypes: Array<[string, ProfileMetricId]>): [string, ProfileMetricId] {
  profileTypes.sort(([serviceA], [serviceB]) => serviceA.localeCompare(serviceB));

  return (
    // CPU
    profileTypes.find(([, profileType]) => getProfileMetric(profileType)?.type === 'cpu') ||
    // Fallback to first
    profileTypes[0]
  );
}

export function getDefaultProfileType(service: string, services: Services): ProfileMetricId | null {
  const serviceProfileTypes: Array<[string, ProfileMetricId]> = Array.from(services.get(service)?.keys() || []).map(
    (id) => [service, id]
  );

  if (!serviceProfileTypes.length) {
    return null;
  }

  return findMostSuitableProfileType(serviceProfileTypes)[1];
}

export function getDefaultServiceAndProfileType(services: Services): [string, ProfileMetricId] {
  const allProfileTypes = Array.from(services.entries()).flatMap(
    ([service, profileTypesMap]) =>
      Array.from(profileTypesMap.keys()).map((id: ProfileMetricId) => [service, id]) as Array<[string, ProfileMetricId]>
  );

  return findMostSuitableProfileType(allProfileTypes);
}
