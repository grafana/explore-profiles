describe('ApiClient', () => {
  const apiBaseUrlCases = [
    ['https://localhost:3000/', 'https://localhost:3000/api/plugins/grafana-pyroscope-app/resources'],
    [
      'https://firedev001.grafana-dev.net/',
      'https://firedev001.grafana-dev.net/api/plugins/grafana-pyroscope-app/resources',
    ],
    // app URL with pathname
    [
      'https://admin-dev-us-central-0.grafana-dev.net/stable-grafana/',
      'https://admin-dev-us-central-0.grafana-dev.net/stable-grafana/api/plugins/grafana-pyroscope-app/resources',
    ],
    // app URL with no slash at the end
    [
      'https://admin-dev-us-central-0.grafana-dev.net/stable-grafana',
      'https://admin-dev-us-central-0.grafana-dev.net/stable-grafana/api/plugins/grafana-pyroscope-app/resources',
    ],
  ];

  describe.each(apiBaseUrlCases)('when the app URL provided by the platform is "%s"', (appUrl, expectedApiBaseUrl) => {
    test(`the API base URL is "${expectedApiBaseUrl}"`, () => {
      // testing like it's 2023 :man_shrug:
      jest.doMock('@grafana/runtime', () => ({ config: { appUrl } }));

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
});
