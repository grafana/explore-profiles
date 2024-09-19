import { config, reportInteraction as grafanaReportInteraction } from '@grafana/runtime';

import { PYROSCOPE_APP_ID, ROUTES } from '../../constants';

const PROFILES_EXPLORER_PAGE_NAME = ROUTES.PROFILES_EXPLORER_VIEW.slice(1);

function getCurrentPage(): string {
  const { pathname } = new URL(window.location.toString());
  return pathname.split('/').pop() || '';
}

function getExtraProperties() {
  const page = getCurrentPage();
  const version = config.apps[PYROSCOPE_APP_ID].version;
  const extraProperties: Record<string, any> = { page, version };

  if (page === PROFILES_EXPLORER_PAGE_NAME) {
    extraProperties.explorationType = new URLSearchParams(window.location.search).get('explorationType');
  }

  return extraProperties;
}

export function reportInteraction(interactionName: string, properties?: Record<string, unknown>) {
  grafanaReportInteraction(interactionName, {
    ...properties,
    ...getExtraProperties(),
  });
}
