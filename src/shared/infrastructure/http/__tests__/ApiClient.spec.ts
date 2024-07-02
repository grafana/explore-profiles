const TEST_DATA_SOURCES = {
  'Test Data Source': {
    id: 1,
    isDefault: true,
    type: 'grafana-pyroscope-datasource',
    name: 'Test Data Source',
    uid: 'grafanacloud-profiles-test',
    jsonData: {},
  },
};

describe('ApiClient', () => {
  const apiBaseUrlCases = [
    ['https://localhost:3000/', 'https://localhost:3000/api/datasources/proxy/uid/grafanacloud-profiles-test'],
    [
      'https://firedev001.grafana-dev.net/',
      'https://firedev001.grafana-dev.net/api/datasources/proxy/uid/grafanacloud-profiles-test',
    ],
    // app URL with pathname
    [
      'https://admin-dev-us-central-0.grafana-dev.net/stable-grafana/',
      'https://admin-dev-us-central-0.grafana-dev.net/stable-grafana/api/datasources/proxy/uid/grafanacloud-profiles-test',
    ],
    // app URL with no slash at the end
    [
      'https://admin-dev-us-central-0.grafana-dev.net/stable-grafana',
      'https://admin-dev-us-central-0.grafana-dev.net/stable-grafana/api/datasources/proxy/uid/grafanacloud-profiles-test',
    ],
  ];

  describe.each(apiBaseUrlCases)('when the app URL provided by the platform is "%s"', (appUrl, expectedApiBaseUrl) => {
    test(`the API base URL is "${expectedApiBaseUrl}"`, () => {
      // testing like it's 2023 :man_shrug:
      jest.doMock('@grafana/runtime', () => ({
        config: {
          appUrl,
          datasources: TEST_DATA_SOURCES,
        },
      }));

      const { ApiClient } = require('../ApiClient');

      const apiClient = new ApiClient();

      expect(apiClient.baseUrl).toBe(expectedApiBaseUrl);
    });
  });

  describe('request headers', () => {
    test('adds default "content-type" and "X-Grafana-Org-Id" headers', () => {
      jest.doMock('@grafana/runtime', () => ({
        config: {
          appUrl: 'https://localhost:3000/',
          datasources: TEST_DATA_SOURCES,
          bootData: {
            user: { orgId: 42 },
          },
        },
      }));

      const { ApiClient } = require('../ApiClient');

      const apiClient = new ApiClient();

      expect(apiClient.defaultHeaders).toEqual({
        'content-type': 'application/json',
        'X-Grafana-Org-Id': '42',
      });
    });
  });

  describe('base URL', () => {
    let originalWindowLocation = window.location;

    beforeEach(() => {
      Object.defineProperty(window, 'location', {
        configurable: true,
        enumerable: true,
        value: new URL(window.location.href),
      });
    });

    afterEach(() => {
      Object.defineProperty(window, 'location', {
        configurable: true,
        enumerable: true,
        value: originalWindowLocation,
      });
    });

    describe('if no data source uid is specified in the URL', () => {
      describe('when a data source is marked as a default override', () => {
        test('uses the override data source to build the base URL', () => {
          jest.doMock('@grafana/runtime', () => ({
            config: {
              appUrl: 'https://localhost:3000/',
              datasources: {
                ...TEST_DATA_SOURCES,
                'Test Data Source bis': {
                  id: 2,
                  type: 'grafana-pyroscope-datasource',
                  name: 'Test Data Source bis',
                  uid: 'grafanacloud-profiles-test-bis',
                  jsonData: {},
                },
                'Test Data Source ter': {
                  id: 2,
                  type: 'grafana-pyroscope-datasource',
                  name: 'Test Data Source ter',
                  uid: 'grafanacloud-profiles-test-ter',
                  jsonData: {
                    overridesDefault: true,
                  },
                },
              },
              bootData: {
                user: { orgId: 42 },
              },
            },
          }));

          const { ApiClient } = require('../ApiClient');

          window.location.href = 'http://localhost:3000/a/grafana-pyroscope-app/single?var-dataSource=';

          const apiClient = new ApiClient();

          expect(apiClient.baseUrl).toBe(
            'https://localhost:3000/api/datasources/proxy/uid/grafanacloud-profiles-test-ter'
          );
        });
      });

      describe('when there is no override', () => {
        test('uses the default data source to build the base URL', () => {
          jest.doMock('@grafana/runtime', () => ({
            config: {
              appUrl: 'https://localhost:3000/',
              datasources: {
                ...TEST_DATA_SOURCES,
                'Another Test Data Source': {
                  id: 2,
                  isDefault: false,
                  type: 'grafana-pyroscope-datasource',
                  name: 'Another Test Data Source',
                  uid: 'grafanacloud-profiles-test-bis',
                  jsonData: {},
                },
              },
              bootData: {
                user: { orgId: 42 },
              },
            },
          }));

          const { ApiClient } = require('../ApiClient');

          window.location.href = 'http://localhost:3000/a/grafana-pyroscope-app/single?var-dataSource=';

          const apiClient = new ApiClient();

          expect(apiClient.baseUrl).toBe('https://localhost:3000/api/datasources/proxy/uid/grafanacloud-profiles-test');
        });
      });

      describe('otherwise', () => {
        test('uses the first data source in the list of all data sources', () => {
          jest.doMock('@grafana/runtime', () => ({
            config: {
              appUrl: 'https://localhost:3000/',
              datasources: {
                'Test Data Source': {
                  id: 1,
                  type: 'grafana-pyroscope-datasource',
                  name: 'Test Data Source',
                  uid: 'grafanacloud-profiles-test',
                  isDefault: false,
                  jsonData: {},
                },
                'Another Test Data Source': {
                  id: 2,
                  type: 'grafana-pyroscope-datasource',
                  name: 'Another Test Data Source',
                  uid: 'grafanacloud-profiles-test-bis',
                  isDefault: false,
                  jsonData: {},
                },
              },
              bootData: {
                user: { orgId: 42 },
              },
            },
          }));

          const { ApiClient } = require('../ApiClient');

          window.location.href = 'http://localhost:3000/a/grafana-pyroscope-app/single?var-dataSource=';

          const apiClient = new ApiClient();

          expect(apiClient.baseUrl).toBe('https://localhost:3000/api/datasources/proxy/uid/grafanacloud-profiles-test');
        });
      });
    });

    describe('if a data source uid is specified in the URL', () => {
      describe('if it exists in the list of all data sources', () => {
        test('uses it to build the base URL', () => {
          jest.doMock('@grafana/runtime', () => ({
            config: {
              appUrl: 'https://localhost:3000/',
              datasources: {
                ...TEST_DATA_SOURCES,
                'Another Test Data Source': {
                  id: 2,
                  isDefault: false,
                  type: 'grafana-pyroscope-datasource',
                  name: 'Another Test Data Source',
                  uid: 'grafanacloud-profiles-test-bis',
                },
              },
              bootData: {
                user: { orgId: 42 },
              },
            },
          }));

          const { ApiClient } = require('../ApiClient');

          window.location.href =
            'http://localhost:3000/a/grafana-pyroscope-app/single?var-dataSource=grafanacloud-profiles-test-bis';

          const apiClient = new ApiClient();

          expect(apiClient.baseUrl).toBe(
            'https://localhost:3000/api/datasources/proxy/uid/grafanacloud-profiles-test-bis'
          );
        });
      });

      describe('if it does not exist in the list of all data sources', () => {
        test('uses the default data source to build the base URL', () => {
          jest.doMock('@grafana/runtime', () => ({
            config: {
              appUrl: 'https://localhost:3000/',
              datasources: {
                ...TEST_DATA_SOURCES,
                'Another Test Data Source': {
                  id: 2,
                  isDefault: false,
                  type: 'grafana-pyroscope-datasource',
                  name: 'Another Test Data Source',
                  uid: 'grafanacloud-profiles-test-bis',
                  jsonData: {},
                },
              },
              bootData: {
                user: { orgId: 42 },
              },
            },
          }));

          const { ApiClient } = require('../ApiClient');

          window.location.href =
            'http://localhost:3000/a/grafana-pyroscope-app/single?var-dataSource=grafanacloud-profiles-test-alternative';

          const apiClient = new ApiClient();

          expect(apiClient.baseUrl).toBe('https://localhost:3000/api/datasources/proxy/uid/grafanacloud-profiles-test');
        });
      });
    });
  });
});
