import { Faro, getWebInstrumentations, initializeFaro } from '@grafana/faro-web-sdk';
import { TracingInstrumentation } from '@grafana/faro-web-tracing';
import { config } from '@grafana/runtime';

import { PYROSCOPE_APP_ID } from '../../constants';
import { GIT_COMMIT } from '../../version';
import { getUserInfo } from './getUserInfo';

const ENVS = [
  // Uncomment to test from your local machine
  // {
  //   matchHost: /localhost/,
  //   faroUrl: 'https://faro-collector-ops-eu-south-0.grafana-ops.net/collect/d6ca259b3387e6ddd641973d0fad3ed0',
  //   appName: 'grafana-pyroscope-local',
  //   environment: 'local',
  // },
  {
    matchHost: /grafana-dev\.net/,
    faroUrl: 'https://faro-collector-ops-eu-south-0.grafana-ops.net/collect/48e03a2647389f2f6494af7f975b4084',
    appName: 'grafana-pyroscope-dev',
    environment: 'dev',
  },
  {
    matchHost: /grafana-ops\.net/,
    faroUrl: 'https://faro-collector-ops-eu-south-0.grafana-ops.net/collect/b5cfd5eeb412cf5e74bd828b4ddd17ff',
    appName: 'grafana-pyroscope-ops',
    environment: 'ops',
  },
  {
    matchHost: /grafana\.net/,
    faroUrl: 'https://faro-collector-ops-eu-south-0.grafana-ops.net/collect/6cbe17b3af4b72ce5936bf4d15a5c393',
    appName: 'grafana-pyroscope-prod',
    environment: 'prod',
  },
];

function init(): Faro | undefined {
  if (!window?.location?.host) {
    return;
  }

  const env = ENVS.find((e) => e.matchHost.test(window.location.host));
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
    user: getUserInfo(),
    instrumentations: [...getWebInstrumentations(), new TracingInstrumentation()],
    isolate: true,
    beforeSend: (event) => {
      if ((event.meta.page?.url ?? '').includes(PYROSCOPE_APP_ID)) {
        return event;
      }

      return null;
    },
  });
}

export const faro = init();
