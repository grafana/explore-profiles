import { SceneObject } from '@grafana/scenes';
import { ComboboxOption } from '@grafana/ui';

import { extractExemplarRows } from '../../SceneExploreServiceHeatmap/infrastructure/buildHeatmapDataFrames';
import { selectHeatmap } from '../../SceneExploreServiceHeatmap/infrastructure/HeatmapApiClient';
import { buildSpanHeatmapQuery } from '../../SceneExploreServiceHeatmap/SceneExploreServiceHeatmap';

/**
 * Span IDs for the current scene, from the same exemplar query the span heatmap runs. Exemplars arrive
 * heaviest first and can repeat, so duplicates are dropped keeping the first occurrence.
 */
export async function fetchSpanIdOptions(scene: SceneObject, limit = 100): Promise<Array<ComboboxOption<string>>> {
  const query = buildSpanHeatmapQuery(scene);

  if (!query) {
    return [];
  }

  const response = await selectHeatmap(query.dataSourceUid, query.request);
  const options: Array<ComboboxOption<string>> = [];
  const seen = new Set<string>();

  for (const row of extractExemplarRows(response)) {
    if (!row.spanId || seen.has(row.spanId)) {
      continue;
    }

    seen.add(row.spanId);
    options.push({
      value: row.spanId,
      label: row.spanId,
      description: row.spanName,
    });

    if (options.length >= limit) {
      break;
    }
  }

  return options;
}
