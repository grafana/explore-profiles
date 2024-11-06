import { getWebInstrumentations, initializeFaro } from '@grafana/faro-web-sdk';

import { PYROSCOPE_APP_ID } from '../../../../../constants';
import { GIT_COMMIT } from '../../../../../version';
import { initFaro } from '../faro';

jest.mock('@grafana/faro-web-sdk');

jest.mock('@grafana/faro-web-tracing');

jest.mock('@grafana/runtime', () => ({
  config: {
    bootData: {
      user: {
        email: 'sixty.four@grafana.com',
      },
    },
    apps: {
      [PYROSCOPE_APP_ID]: {
        version: 'v0.01-test',
      },
    },
  },
}));

describe('initFaro()', () => {
  beforeEach(() => {
    (initializeFaro as jest.Mock).mockReturnValue({});
    (getWebInstrumentations as jest.Mock).mockReturnValue([]);
  });

  describe('when running in environment where the host is not defined', () => {
    it('does not initialize Faro', () => {
      Object.defineProperty(window, 'location', {
        value: { host: undefined },
        writable: true,
      });

      initFaro();

      expect(initializeFaro as jest.Mock).not.toHaveBeenCalled();
    });
  });

  describe('when running in an unknown environment', () => {
    it('does not initialize Faro', () => {
      Object.defineProperty(window, 'location', {
        value: { host: 'unknownhost' },
        writable: true,
      });

      initFaro();

      expect(initializeFaro as jest.Mock).not.toHaveBeenCalled();
    });
  });

  describe('when running in an known environment', () => {
    test.each([
      // dev
      [
        'grafana-dev.net',
        'https://faro-collector-ops-eu-south-0.grafana-ops.net/collect/48e03a2647389f2f6494af7f975b4084',
        'grafana-pyroscope-dev',
      ],
      [
        'test.grafana-dev.net',
        'https://faro-collector-ops-eu-south-0.grafana-ops.net/collect/48e03a2647389f2f6494af7f975b4084',
        'grafana-pyroscope-dev',
      ],
      // ops
      [
        'foobar.grafana-ops.net',
        'https://faro-collector-ops-eu-south-0.grafana-ops.net/collect/b5cfd5eeb412cf5e74bd828b4ddd17ff',
        'grafana-pyroscope-ops',
      ],
      [
        'grafana-ops.net',
        'https://faro-collector-ops-eu-south-0.grafana-ops.net/collect/b5cfd5eeb412cf5e74bd828b4ddd17ff',
        'grafana-pyroscope-ops',
      ],
      // prod
      [
        'foobar.grafana.net',
        'https://faro-collector-ops-eu-south-0.grafana-ops.net/collect/6cbe17b3af4b72ce5936bf4d15a5c393',
        'grafana-pyroscope-prod',
      ],
      [
        'grafana.net',
        'https://faro-collector-ops-eu-south-0.grafana-ops.net/collect/6cbe17b3af4b72ce5936bf4d15a5c393',
        'grafana-pyroscope-prod',
      ],
    ])('initializes Faro for the host "%s"', (host, faroUrl, appName) => {
      Object.defineProperty(window, 'location', {
        value: { host },
        writable: true,
      });

      initFaro();

      expect((initializeFaro as jest.Mock).mock.lastCall[0].url).toBe(faroUrl);
      expect((initializeFaro as jest.Mock).mock.lastCall[0].app.name).toBe(appName);
    });

    it('initializes the app and user metadata', () => {
      Object.defineProperty(window, 'location', {
        value: { host: 'grafana.net' },
        writable: true,
      });

      initFaro();

      const { app, user } = (initializeFaro as jest.Mock).mock.lastCall[0];

      expect(app).toEqual({
        name: 'grafana-pyroscope-prod',
        release: 'v0.01-test',
        version: GIT_COMMIT,
        environment: 'prod',
      });

      expect(user).toEqual({ email: 'sixty.four@grafana.com' });
    });
  });
});
