import { config } from '@grafana/runtime';

export const featureToggles = {
  // @ts-ignore Remove after upgrading grafana/runtime to version including the toggle type
  metricsFromProfiles: !!config.featureToggles['metricsFromProfiles'],
  // @ts-ignore Remove after upgrading grafana/runtime to version including the toggle type
  grafanaAssistantInProfilesDrilldown: !!config.featureToggles['grafanaAssistantInProfilesDrilldown'],
};
