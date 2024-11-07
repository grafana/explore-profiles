import { Faro, getWebInstrumentations, initializeFaro } from '@grafana/faro-web-sdk';
import { TracingInstrumentation } from '@grafana/faro-web-tracing';
import { config } from '@grafana/runtime';

import { PYROSCOPE_APP_ID } from '../../../../constants';
import { GIT_COMMIT } from '../../../../version';
import { getFaroEnvironment } from './getFaroEnvironment';

let faro: Faro | null = null;

export const getFaro = () => faro;
export const setFaro = (instance: Faro | null) => (faro = instance);

export function initFaro() {
  if (getFaro()) {
    return;
  }

  const faroEnvironment = getFaroEnvironment();
  if (!faroEnvironment) {
    return;
  }

  const { environment, faroUrl, appName } = faroEnvironment;

  const { apps, bootData } = config;
  const appRelease = apps[PYROSCOPE_APP_ID].version;
  const userEmail = bootData.user.email;

  setFaro(
    initializeFaro({
      url: faroUrl,
      app: {
        name: appName,
        release: appRelease,
        version: GIT_COMMIT,
        environment,
      },
      user: {
        email: userEmail,
      },
      instrumentations: [...getWebInstrumentations(), new TracingInstrumentation()],
      isolate: true,
      beforeSend: (event) => {
        if ((event.meta.page?.url ?? '').includes(PYROSCOPE_APP_ID)) {
          return event;
        }

        return null;
      },
    })
  );
}
