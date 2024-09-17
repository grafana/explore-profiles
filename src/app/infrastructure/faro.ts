import { Faro, getWebInstrumentations, initializeFaro, MetaUser } from '@grafana/faro-web-sdk';
import { TracingInstrumentation } from '@grafana/faro-web-tracing';
import { config } from '@grafana/runtime';

import { PYROSCOPE_APP_ID } from '../../constants';
import { GIT_COMMIT } from '../../version';

const ENVS = [
  // Uncomment to test from your local machine
  // {
  //   matchHost: RegExp('localhost'),
  //   faroUrl: 'https://faro-collector-prod-us-central-0.grafana.net/collect/463f8b5f923a05942a042b078fe73a5b',
  //   appName: 'grafana-pyroscope-local',
  //   environment: 'local',
  // },
  {
    matchHost: RegExp('grafana-dev\\.net'),
    faroUrl: 'https://faro-collector-prod-us-central-0.grafana.net/collect/ef0e8de540b188353797d3d95a3b62f8',
    appName: 'grafana-pyroscope-dev',
    environment: 'dev',
  },
  {
    matchHost: RegExp('grafana-ops\\.net'),
    faroUrl: 'https://faro-collector-prod-us-central-0.grafana.net/collect/7d1458bdee74eef4d3d7c57665862e33',
    appName: 'grafana-pyroscope-ops',
    environment: 'ops',
  },
  {
    matchHost: RegExp('grafana\\.net'),
    faroUrl: 'https://faro-collector-prod-us-central-0.grafana.net/collect/20ca4982e590cb9b90ad1a6e9f152230',
    appName: 'grafana-pyroscope-prod',
    environment: 'prod',
  },
];

const matchHost = (host: string) => ENVS.find((a) => a.matchHost.test(host));

function extractUserMeta(): MetaUser {
  const { id, email, login } = config.bootData.user;

  const user = {
    id: String(id),
    email: email,
    username: login,
  };

  return user;
}

function init(): Faro | undefined {
  if (!window?.location?.host) {
    return;
  }

  const env = matchHost(window.location.host);
  if (!env) {
    return;
  }

  return initializeFaro({
    url: env.faroUrl,
    app: {
      name: env.appName,
      release: config.apps[PYROSCOPE_APP_ID].version,
      version: GIT_COMMIT,
      environment: env.environment,
    },
    instrumentations: [...getWebInstrumentations(), new TracingInstrumentation()],
    isolate: true,
    user: extractUserMeta(),
  });
}

export const faro = init();
