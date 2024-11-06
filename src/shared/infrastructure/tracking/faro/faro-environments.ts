import { Environment } from '../getEnvironment';
import { FaroEnvironment } from './getFaroEnvironment';

export const FARO_ENVIRONMENTS = new Map<Environment, FaroEnvironment>([
  // Uncomment this map entry to test from your local machine
  // [
  //   'local',
  //   {
  //     environment: 'local',
  //     appName: 'grafana-pyroscope-local',
  //     faroUrl: 'https://faro-collector-ops-eu-south-0.grafana-ops.net/collect/d6ca259b3387e6ddd641973d0fad3ed0',
  //   },
  // ],
  // Always keep the options below
  [
    'dev',
    {
      environment: 'dev',
      appName: 'grafana-pyroscope-dev',
      faroUrl: 'https://faro-collector-ops-eu-south-0.grafana-ops.net/collect/48e03a2647389f2f6494af7f975b4084',
    },
  ],
  [
    'ops',
    {
      environment: 'ops',
      appName: 'grafana-pyroscope-ops',
      faroUrl: 'https://faro-collector-ops-eu-south-0.grafana-ops.net/collect/b5cfd5eeb412cf5e74bd828b4ddd17ff',
    },
  ],
  [
    'prod',
    {
      environment: 'prod',
      appName: 'grafana-pyroscope-prod',
      faroUrl: 'https://faro-collector-ops-eu-south-0.grafana-ops.net/collect/6cbe17b3af4b72ce5936bf4d15a5c393',
    },
  ],
]);
