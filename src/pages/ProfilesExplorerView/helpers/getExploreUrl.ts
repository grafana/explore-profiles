import { RawTimeRange, toURLRange, urlUtil } from '@grafana/data';
import { config } from '@grafana/runtime';
import { SceneDataQuery } from '@grafana/scenes';

export function getExploreUrl(rawTimeRange: RawTimeRange, query: SceneDataQuery, datasource: string): string {
  const exploreState = JSON.stringify({
    ['pyroscope-explore']: {
      range: toURLRange(rawTimeRange),
      queries: [{ ...query, datasource }],
      panelsState: {},
      datasource,
    },
  });

  const subUrl = config.appSubUrl ?? '';

  return urlUtil.renderUrl(`${subUrl}/explore`, {
    panes: exploreState,
    schemaVersion: 1,
  });
}
