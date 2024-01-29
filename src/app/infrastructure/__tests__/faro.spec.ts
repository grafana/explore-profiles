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
      'pyroscope-app-dev',
      'https://faro-collector-prod-us-central-0.grafana.net/collect/ef0e8de540b188353797d3d95a3b62f8',
    ],
    [
      'test.grafana-dev.net',
      'pyroscope-app-dev',
      'https://faro-collector-prod-us-central-0.grafana.net/collect/ef0e8de540b188353797d3d95a3b62f8',
    ],
    // Ops
    [
      'foobar.grafana-ops.net',
      'pyroscope-app-ops',
      'https://faro-collector-prod-us-central-0.grafana.net/collect/7d1458bdee74eef4d3d7c57665862e33',
    ],
    [
      'grafana-ops.net',
      'pyroscope-app-ops',
      'https://faro-collector-prod-us-central-0.grafana.net/collect/7d1458bdee74eef4d3d7c57665862e33',
    ],
    // Prod
    [
      'foobar.grafana.net',
      'pyroscope-app-prod',
      'https://faro-collector-prod-us-central-0.grafana.net/collect/20ca4982e590cb9b90ad1a6e9f152230',
    ],
    [
      'grafana.net',
      'pyroscope-app-prod',
      'https://faro-collector-prod-us-central-0.grafana.net/collect/20ca4982e590cb9b90ad1a6e9f152230',
    ],
  ])('It initializes faro for environment %s', (host, appName, url) => {
    Object.defineProperty(window, 'location', {
      value: { host },
      writable: true,
    });
    const { faro } = require('../faro');

    expect(faro).toBeDefined();
    expect(initializeFaro.mock.lastCall[0].url).toBe(url);
    expect(initializeFaro.mock.lastCall[0].app.name).toBe(appName);
  });

  it('does nothing if running in an invalid env', () => {
    Object.defineProperty(window, 'location', {
      value: { host: 'INVALID_ENV' },
      writable: true,
    });
    const { faro } = require('../faro');

    expect(faro).not.toBeDefined();
    expect(initializeFaro.mock.lastCall).toBeUndefined();
  });

  it('applies grafana user data and GIT_COMMIT data into faro init arguments', () => {
    const host = 'grafana.net';

    Object.defineProperty(window, 'location', {
      value: { host },
      writable: true,
    });
    const { faro } = require('../faro');

    expect(faro).toBeDefined();

    const user = initializeFaro.mock.lastCall[0].user;
    expect(user.id).toEqual(String(MOCK_USER.id));
    expect(user.email).toEqual(MOCK_USER.email);
    expect(user.username).toEqual(MOCK_USER.login);

    const app = initializeFaro.mock.lastCall[0].app;
    expect(app.version).toEqual(GIT_COMMIT);
  });
});
