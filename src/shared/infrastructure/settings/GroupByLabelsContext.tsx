import React, { createContext, useContext, useMemo } from 'react';

import {
  DEFAULT_LABEL_PRESETS,
  DEFAULT_SETTINGS,
  getActiveLabelPreset,
  isDefaultServiceNamePreset,
  LabelPreset,
} from './PluginSettings';
import { useFetchPluginSettings } from './useFetchPluginSettings';

type LabelPresetContextValue = {
  activePreset: LabelPreset;
  allPresets: LabelPreset[];
  isLoading: boolean;
  isDefaultPreset: boolean;
};

const LabelPresetContext = createContext<LabelPresetContextValue>({
  activePreset: DEFAULT_LABEL_PRESETS[0],
  allPresets: DEFAULT_LABEL_PRESETS,
  isLoading: true,
  isDefaultPreset: true,
});

export function LabelPresetProvider({ children }: { children: React.ReactNode }) {
  const { settings, isFetching } = useFetchPluginSettings();

  const value = useMemo(() => {
    const effectiveSettings = settings ?? DEFAULT_SETTINGS;
    return {
      activePreset: getActiveLabelPreset(effectiveSettings),
      allPresets: effectiveSettings.labelPresets ?? DEFAULT_LABEL_PRESETS,
      isLoading: isFetching,
      isDefaultPreset: isDefaultServiceNamePreset(effectiveSettings),
    };
  }, [settings, isFetching]);

  return <LabelPresetContext.Provider value={value}>{children}</LabelPresetContext.Provider>;
}

export function useLabelPreset(): LabelPresetContextValue {
  return useContext(LabelPresetContext);
}

// Backwards compatibility aliases
export const GroupByLabelsProvider = LabelPresetProvider;
export function useGroupByLabels() {
  const { activePreset, isLoading, isDefaultPreset } = useLabelPreset();
  return {
    groupByLabels: activePreset.labels,
    isLoading,
    isUsingHierarchy: !isDefaultPreset,
  };
}
