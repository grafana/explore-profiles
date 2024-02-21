import { PluginSettings } from './settingsApiClient';

export const DEFAULT_SETTINGS: PluginSettings = Object.freeze({
  collapsedFlamegraphs: false,
  maxNodes: 16384,
  enableFlameGraphDotComExport: true,
});
