import { reportInteraction as grafanaReportInteraction } from '@grafana/runtime';

function getCurrentPage(): string {
  const { pathname } = new URL(window.location.toString());
  return pathname.split('/').pop() || '';
}

export function reportInteraction(interactionName: string, properties?: Record<string, unknown>) {
  grafanaReportInteraction(interactionName, { ...properties, page: getCurrentPage() });
}
