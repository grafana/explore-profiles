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
    faroUrl: 'https://faro-collector-prod-us-central-0.grafana.net/collect/31b6971780839bbf89ec070a092a9490',
    matchHost: RegExp('grafana-dev\\.net'),
  },
  {
    appName: 'pyroscope-app-ops',
    faroUrl: 'https://faro-collector-prod-us-central-0.grafana.net/collect/2a05f9e7c907b04c28ba5638f5174dde',
    matchHost: RegExp('grafana-ops\\.net'),
  },
  {
    appName: 'pyroscope-app-prod',
    faroUrl: 'https://faro-collector-prod-us-central-0.grafana.net/collect/3a26d34f379b4256b828e6da4f5d0cae',
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
