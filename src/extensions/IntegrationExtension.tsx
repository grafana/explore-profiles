export enum CollectorSelectionMode {
  SelectCollectors = 'select-collectors',
  MatchCollectors = 'match-collectors',
}
export interface IntegrationExtensionProps {
  collectorSelectionMode?: CollectorSelectionMode;
}
