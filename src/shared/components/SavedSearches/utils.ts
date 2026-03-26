import { AdHocVariableFilter } from '@grafana/data';
import { sceneGraph, SceneObject } from '@grafana/scenes';
import { OperatorKind } from '@shared/components/QueryBuilder/domain/types';

import { SceneProfilesExplorer } from '../../../pages/ProfilesExplorerView/components/SceneProfilesExplorer/SceneProfilesExplorer';
import { FiltersVariable } from '../../../pages/ProfilesExplorerView/domain/variables/FiltersVariable/FiltersVariable';
import { ProfilesDataSourceVariable } from '../../../pages/ProfilesExplorerView/domain/variables/ProfilesDataSourceVariable';
import { parseRawFilters } from '../QueryBuilder/domain/helpers/queryToFilters';

export function getProfilesExplorerScene(scene: SceneObject): SceneProfilesExplorer {
  return sceneGraph.getAncestor(scene, SceneProfilesExplorer) as SceneProfilesExplorer;
}

export function getDatasourceVariable(scene: SceneObject): ProfilesDataSourceVariable {
  return sceneGraph.findByKeyAndType(scene, 'dataSource', ProfilesDataSourceVariable) as ProfilesDataSourceVariable;
}

export function getFiltersVariable(explorerScene: SceneProfilesExplorer): FiltersVariable {
  return sceneGraph.findByKeyAndType(explorerScene, 'filters', FiltersVariable) as FiltersVariable;
}

// --- Saved search: filters to label selector (used when saving) ---

const isValidFilter = (f: AdHocVariableFilter): boolean =>
  f.operator in OperatorKind && f.key !== '__profile_type__' && f.value !== undefined && f.value !== 'undefined';

export function buildFilterExpressionParts(filters: AdHocVariableFilter[]): string {
  return filters
    .filter(isValidFilter)
    .map((f) => (f.operator === OperatorKind['is-empty'] ? `${f.key}=""` : `${f.key}${f.operator}"${f.value ?? ''}"`))
    .join(',');
}

/** Builds label selector for saved query (profile type is set separately as profileTypeId on the query). */
export function filtersToLabelSelectorExpression(filters: AdHocVariableFilter[]): string {
  const parts = buildFilterExpressionParts(filters);
  return parts ? `{${parts}}` : '{}';
}

// --- Saved search: label selector to ad-hoc filters (used when loading) ---

/**
 * Parses a Pyroscope-style label selector (e.g. `{job="test"}` or full query
 * `profileTypeId{service_name="x",job="test"}`) into ad-hoc variable filters.
 * Excludes service_name (handled by ServiceNameVariable).
 */
export function parseLabelSelectorToAdHocFilters(selector: string): AdHocVariableFilter[] {
  if (!selector?.trim()) {
    return [];
  }
  const trimmed = selector.trim();
  const braceMatch = trimmed.match(/\{(.+)\}$/);
  const inner = braceMatch ? braceMatch[1] : trimmed.startsWith('{') ? trimmed.slice(1, -1) : trimmed;
  const raw = parseRawFilters(inner);
  return raw
    .filter(([key]) => key !== 'service_name')
    .map(([key, operator, value]): AdHocVariableFilter => ({ key, operator, value }));
}
