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
      'https://faro-collector-prod-us-central-0.grafana.net/collect/ef0e8de540b188353797d3d95a3b62f8',
      'grafana-pyroscope-dev',
    ],
    [
      'test.grafana-dev.net',
      'https://faro-collector-prod-us-central-0.grafana.net/collect/ef0e8de540b188353797d3d95a3b62f8',
      'grafana-pyroscope-dev',
    ],
    // Ops
    [
      'foobar.grafana-ops.net',
      'https://faro-collector-prod-us-central-0.grafana.net/collect/7d1458bdee74eef4d3d7c57665862e33',
      'grafana-pyroscope-ops',
    ],
    [
      'grafana-ops.net',
      'https://faro-collector-prod-us-central-0.grafana.net/collect/7d1458bdee74eef4d3d7c57665862e33',
      'grafana-pyroscope-ops',
    ],
    // Prod
    [
      'foobar.grafana.net',
      'https://faro-collector-prod-us-central-0.grafana.net/collect/20ca4982e590cb9b90ad1a6e9f152230',
      'grafana-pyroscope-prod',
    ],
    [
      'grafana.net',
      'https://faro-collector-prod-us-central-0.grafana.net/collect/20ca4982e590cb9b90ad1a6e9f152230',
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

    expect(user.id).toEqual(String(MOCK_USER.id));
    expect(user.email).toEqual(MOCK_USER.email);
    expect(user.username).toEqual(MOCK_USER.login);

    expect(app.release).toEqual('v0.01-test');
    expect(app.version).toEqual(GIT_COMMIT);
  });
});
