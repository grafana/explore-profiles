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

  it('calls Grafana\'s reportInteraction with a new "meta" property', () => {
    Object.defineProperty(window, 'location', {
      value: new URL('http://localhost:3000/a/grafana-pyroscope-app/test-page-1'),
      writable: true,
    });

    reportInteraction('g_pyroscope_app_exploration_type_clicked');

    expect(grafanaReportInteraction).toHaveBeenCalledWith('g_pyroscope_app_exploration_type_clicked', {
      props: undefined,
      meta: {
        page: 'test-page-1',
        appRelease: '1.0.0',
        appVersion: 'dev',
      },
    });
  });
  describe('if the current URL corresponds to the "profiles-explorer" page', () => {
    it('adds a "view" meta', () => {
      Object.defineProperty(window, 'location', {
        value: new URL('http://localhost:3000/a/grafana-pyroscope-app/explore?explorationType=flame-graph'),
        writable: true,
      });

      reportInteraction('g_pyroscope_app_exploration_type_clicked');

      expect(grafanaReportInteraction).toHaveBeenCalledWith('g_pyroscope_app_exploration_type_clicked', {
        props: undefined,
        meta: {
          appRelease: '1.0.0',
          appVersion: 'dev',
          page: 'explore',
          view: 'flame-graph',
        },
      });
    });
  });

  describe('if some extra properties are passed', () => {
    it('calls Grafana\'s reportInteraction with these properties as well as a new "page" property', () => {
      Object.defineProperty(window, 'location', {
        value: new URL('http://localhost:3000/a/grafana-pyroscope-app/test-page-2'),
        writable: true,
      });

      reportInteraction('g_pyroscope_app_exploration_type_clicked', { explorationType: 'unit-tests' });

      expect(grafanaReportInteraction).toHaveBeenCalledWith('g_pyroscope_app_exploration_type_clicked', {
        props: {
          explorationType: 'unit-tests',
        },
        meta: {
          appRelease: '1.0.0',
          appVersion: 'dev',
          page: 'test-page-2',
        },
      });
    });
  });
});
