import { reportInteraction as grafanaReportInteraction } from '@grafana/runtime';

import { reportInteraction } from '../reportInteraction';

jest.mock('@grafana/runtime', () => ({
  reportInteraction: jest.fn(),
  config: {
    apps: {
      'grafana-pyroscope-app': {
        version: '1.0.0',
      },
    },
  },
}));

describe('reportInteraction(interactionName, properties)', () => {
  const originalLocation = window.location;

  afterEach(() => {
    window.location = originalLocation;
  });

  it('calls Grafana\'s reportInteraction with a new "page" property', () => {
    Object.defineProperty(window, 'location', {
      value: 'http://localhost:3000/a/grafana-pyroscope-app/test-page-1',
      writable: true,
    });

    reportInteraction('unit_test_executed');

    expect(grafanaReportInteraction).toHaveBeenCalledWith('unit_test_executed', {
      page: 'test-page-1',
      version: '1.0.0',
    });
  });

  describe('if some extra properties are passed', () => {
    it('calls Grafana\'s reportInteraction with these properties as well as a new "page" property', () => {
      Object.defineProperty(window, 'location', {
        value: 'http://localhost:3000/a/grafana-pyroscope-app/test-page-2',
        writable: true,
      });

      reportInteraction('unit_test_executed', { testFramework: 'Jest' });

      expect(grafanaReportInteraction).toHaveBeenCalledWith('unit_test_executed', {
        page: 'test-page-2',
        testFramework: 'Jest',
        version: '1.0.0',
      });
    });
  });
});
