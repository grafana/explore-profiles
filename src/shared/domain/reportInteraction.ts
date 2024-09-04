import { reportInteraction as grafanaReportInteraction } from '@grafana/runtime';

import { ROUTES } from '../../constants';

const PROFILES_EXPLORER_PAGE_NAME = ROUTES.PROFILES_EXPLORER_VIEW.slice(1);

function getCurrentPage(): string {
  const { pathname } = new URL(window.location.toString());
  return pathname.split('/').pop() || '';
}

function getExtraProperties() {
  const page = getCurrentPage();
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

/**
 * "unset" may be tracked in case reportInteraction is called before the plugin version is retrieved
 */
let version = 'unset';

export function setTrackingVersion(value: string): void {
  version = value;
}
