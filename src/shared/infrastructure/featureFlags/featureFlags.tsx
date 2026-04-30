import type { FeatureToggles } from '@grafana/data';
import { useBooleanFlagDetails } from '@openfeature/react-sdk';

import { getPluginOpenFeatureBoolean } from './openFeature';

/**
 * Grafana registry-backed flags via OpenFeature. Call sites must sit under
 * `OpenFeaturePluginScope` from `./openFeature`.
 *
 * @see https://github.com/grafana/grafana/blob/main/contribute/feature-toggles.md
 */
const flameGraphWithCallTreeKey = 'flameGraphWithCallTree' as keyof FeatureToggles;
const metricsFromProfilesKey = 'metricsFromProfiles' as keyof FeatureToggles;
const grafanaAssistantInProfilesDrilldownKey = 'grafanaAssistantInProfilesDrilldown' as keyof FeatureToggles;
const profilesExemplarsKey = 'profilesExemplars' as keyof FeatureToggles;
const pyroscopeUTF8LabelNamesKey = 'pyroscopeUTF8LabelNames' as keyof FeatureToggles;
export const QUERY_LIBRARY_FEATURE_FLAG_KEY = 'queryLibrary' as const;
const queryLibraryKey: keyof FeatureToggles = QUERY_LIBRARY_FEATURE_FLAG_KEY;

export function useFlagFlameGraphWithCallTree(): boolean {
  return useBooleanFlagDetails(flameGraphWithCallTreeKey, false).value;
}

export function useFlagMetricsFromProfiles(): boolean {
  return useBooleanFlagDetails(metricsFromProfilesKey, false).value;
}

export function useFlagGrafanaAssistantInProfilesDrilldown(): boolean {
  return useBooleanFlagDetails(grafanaAssistantInProfilesDrilldownKey, false).value;
}

export function getProfilesExemplarsFromOpenFeature(): boolean {
  return getPluginOpenFeatureBoolean(profilesExemplarsKey, false);
}

export function getPyroscopeUTF8LabelNamesFromOpenFeature(): boolean {
  return getPluginOpenFeatureBoolean(pyroscopeUTF8LabelNamesKey, false);
}

export function getQueryLibraryFromOpenFeature(): boolean {
  return getPluginOpenFeatureBoolean(queryLibraryKey, false);
}
