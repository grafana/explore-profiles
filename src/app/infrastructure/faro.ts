import { Faro, getWebInstrumentations, initializeFaro, MetaUser } from '@grafana/faro-web-sdk';
import { TracingInstrumentation } from '@grafana/faro-web-tracing';
import { config } from '@grafana/runtime';

import { GIT_COMMIT } from '../../version';

const ENVS = [
  // TODO: enable this for testing locally
  //  {
  //    appName: 'pyroscope-app-local',
  //    faroUrl: 'https://faro-collector-prod-us-central-0.grafana.net/collect/b5d98983a44fc0d4d425aad4997b69d0',
  //    matchHost: RegExp('localhost:3000'),
  //  },
  {
    appName: 'pyroscope-app-dev',
    faroUrl: 'https://faro-collector-prod-us-central-0.grafana.net/collect/ef0e8de540b188353797d3d95a3b62f8',
    matchHost: RegExp('grafana-dev\\.net'),
  },
  {
    appName: 'pyroscope-app-ops',
    faroUrl: 'https://faro-collector-prod-us-central-0.grafana.net/collect/7d1458bdee74eef4d3d7c57665862e33',
    matchHost: RegExp('grafana-ops\\.net'),
  },
  {
    appName: 'pyroscope-app-prod',
    faroUrl: 'https://faro-collector-prod-us-central-0.grafana.net/collect/20ca4982e590cb9b90ad1a6e9f152230',
    matchHost: RegExp('grafana\\.net'),
  },
];

function matchHost(host: string) {
  return ENVS.find((a) => {
    return a.matchHost.test(host);
  });
}

function init(): Faro | undefined {
  if (!window) {
    return;
  }

  if (!window.location.host) {
    return;
  }

  const env = matchHost(window.location.host);
  if (!env) {
    return;
  }

  return initializeFaro({
    url: env.faroUrl,
    user: extractUserMeta(),
    isolate: true,
    instrumentations: [...getWebInstrumentations(), new TracingInstrumentation()],
    app: {
      name: env.appName,
      version: GIT_COMMIT,
      // TODO: capture version from git tags when building
      //      version: '1.0.0',
    },
  });
}

function extractUserMeta() {
  const { id, email, login } = config.bootData.user;

  const user: MetaUser = {
    id: String(id),
    email: email,
    username: login,
  };

  return user;
}

export const faro = init();