describe('PyroscopeApiClient', () => {
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

      const { PyroscopeApiClient } = require('../PyroscopeApiClient');

      const client = new PyroscopeApiClient();

      expect(client.baseUrl).toBe(expectedApiBaseUrl);
    });
  });
});
