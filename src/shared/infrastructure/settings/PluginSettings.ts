export type LabelPreset = {
  name: string;
  labels: string[];
};

export const DEFAULT_LABEL_PRESETS: LabelPreset[] = [
  { name: 'Services', labels: ['service_name'] },
  { name: 'Kubernetes', labels: ['cluster', 'namespace', 'container'] },
];

export type PluginSettings = {
  collapsedFlamegraphs: boolean;
  maxNodes: number;
  enableFlameGraphDotComExport: boolean;
  enableFunctionDetails: boolean;
  enableMetricsFromProfiles?: boolean;
  labelPresets: LabelPreset[];
  activeLabelPreset: string;
};

export const DEFAULT_SETTINGS: PluginSettings = Object.freeze({
  collapsedFlamegraphs: false,
  maxNodes: 16384,
  enableFlameGraphDotComExport: true,
  enableFunctionDetails: true,
  enableMetricsFromProfiles: false,
  labelPresets: DEFAULT_LABEL_PRESETS,
  activeLabelPreset: 'Services',
});

/**
 * Gets the active label preset from settings
 */
export function getActiveLabelPreset(settings: PluginSettings): LabelPreset {
  const preset = settings.labelPresets.find((p) => p.name === settings.activeLabelPreset);
  return preset || DEFAULT_LABEL_PRESETS[0];
}

/**
 * Checks if the active preset is the default service_name preset
 */
export function isDefaultServiceNamePreset(settings: PluginSettings): boolean {
  const preset = getActiveLabelPreset(settings);
  return preset.labels.length === 1 && preset.labels[0] === 'service_name';
}
