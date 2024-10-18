import { PYROSCOPE_APP_ID } from '../../../constants';
import { GIT_COMMIT } from '../../../version';

const initializeFaro = jest.fn();
jest.mock('@grafana/faro-web-sdk', () => ({
  initializeFaro: initializeFaro.mockReturnValue({}),
  getWebInstrumentations: () => [],
}));

jest.mock('@grafana/faro-web-tracing', () => ({
  TracingInstrumentation: jest.fn(),
}));

const MOCK_USER = {
  id: 64,
  email: 'sixty.four@grafana.com',
  login: 'user64',
};

jest.mock('@grafana/runtime', () => ({
  config: {
    bootData: {
      user: MOCK_USER,
    },
    apps: {
      [PYROSCOPE_APP_ID]: {
        version: 'v0.01-test',
      },
    },
  },
}));

describe('Faro', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    jest.resetModules();
  });

  test.each([
    // Dev
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
    // Ops
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
    // Prod
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
  ])('initializes properly for the host "%s"', (host, faroUrl, appName) => {
    Object.defineProperty(window, 'location', {
      value: { host },
      writable: true,
    });
    const { faro } = require('../faro');

    expect(faro).toBeDefined();
    expect(initializeFaro.mock.lastCall[0].url).toBe(faroUrl);
    expect(initializeFaro.mock.lastCall[0].app.name).toBe(appName);
  });

  it('does nothing if running in an unknown environment', () => {
    Object.defineProperty(window, 'location', {
      value: { host: 'INVALID_ENV' },
      writable: true,
    });
    const { faro } = require('../faro');

    expect(faro).not.toBeDefined();
    expect(initializeFaro.mock.lastCall).toBeUndefined();
  });

  it('initializes the Grafana user data, the app release and version', () => {
    const host = 'grafana.net';

    Object.defineProperty(window, 'location', {
      value: { host },
      writable: true,
    });
    const { faro } = require('../faro');

    expect(faro).toBeDefined();

    const { user, app } = initializeFaro.mock.lastCall[0];

    expect(user.email).toEqual(MOCK_USER.email);
    expect(app.release).toEqual('v0.01-test');
    expect(app.version).toEqual(GIT_COMMIT);
  });
});
