import { Faro, getWebInstrumentations, initializeFaro } from '@grafana/faro-web-sdk';
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

  const { apps, bootData, buildInfo } = config;

  const appRelease = apps[PYROSCOPE_APP_ID].version;
  const userEmail = bootData.user.email;
  const grafanaVersion = `v${buildInfo.version} (${buildInfo.edition})`;

  setFaro(
    initializeFaro({
      url: faroUrl,
      app: {
        name: appName,
        release: appRelease,
        version: GIT_COMMIT,
        environment,
        namespace: grafanaVersion, // :man_shrug:
      },
      user: {
        email: userEmail,
      },
      instrumentations: [
        ...getWebInstrumentations({
          captureConsole: false,
        }),
      ],
      isolate: true,
      beforeSend: (event) => {
        if ((event.meta.page?.url ?? '').includes(PYROSCOPE_APP_ID)) {
          event.meta.view = {
            name: new URLSearchParams(event.meta.page?.url).get('explorationType') || '',
          };

          return event;
        }

        return null;
      },
    })
  );
}
