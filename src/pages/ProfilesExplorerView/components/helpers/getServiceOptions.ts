import { Services } from '@shared/infrastructure/services/servicesApiClient';

export type ServiceOptions = Array<{ value: string; label: string }>;

export function getServiceOptions(services: Services) {
  return Array.from(services.keys())
    .sort((a, b) => a.localeCompare(b))
    .map((id) => ({
      value: id,
      label: id,
    }));
}
