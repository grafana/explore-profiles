import { Environment, getEnvironment } from '../getEnvironment';
import { FARO_ENVIRONMENTS } from './faro-environments';

export type FaroEnvironment = { environment: Environment; appName: string; faroUrl: string };

export function getFaroEnvironment() {
  const environment = getEnvironment();

  if (!environment || !FARO_ENVIRONMENTS.has(environment)) {
    return;
  }

  return FARO_ENVIRONMENTS.get(environment) as FaroEnvironment;
}
