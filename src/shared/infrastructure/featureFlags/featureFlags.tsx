import type { FeatureToggles } from '@grafana/data';
import { useBooleanFlagDetails } from '@openfeature/react-sdk';

/**
 * Grafana registry-backed flags via OpenFeature. Call sites must sit under
 * `OpenFeaturePluginScope` from `./openFeature`.
 *
 * @see https://github.com/grafana/grafana/blob/main/contribute/feature-toggles.md
 */
const FLAME_GRAPH_WITH_CALL_TREE = 'flameGraphWithCallTree' as const;
const flameGraphWithCallTreeKey = FLAME_GRAPH_WITH_CALL_TREE as keyof FeatureToggles;

export function useFlagFlameGraphWithCallTree(): boolean {
  return useBooleanFlagDetails(flameGraphWithCallTreeKey, false).value;
}
