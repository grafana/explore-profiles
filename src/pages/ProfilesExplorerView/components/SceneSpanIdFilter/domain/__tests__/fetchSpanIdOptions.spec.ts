import { SceneObject } from '@grafana/scenes';

import { fetchSpanIdOptions } from '../fetchSpanIdOptions';

jest.mock('../../../SceneExploreServiceHeatmap/SceneExploreServiceHeatmap', () => ({
  buildSpanHeatmapQuery: jest.fn(),
}));

jest.mock('../../../SceneExploreServiceHeatmap/infrastructure/HeatmapApiClient', () => ({
  selectHeatmap: jest.fn(),
}));

const { buildSpanHeatmapQuery } = jest.requireMock('../../../SceneExploreServiceHeatmap/SceneExploreServiceHeatmap');
const { selectHeatmap } = jest.requireMock('../../../SceneExploreServiceHeatmap/infrastructure/HeatmapApiClient');

const scene = {} as SceneObject;

/** Shapes a SelectHeatmapResponse with the given exemplars, ordered by descending value. */
function buildResponse(exemplars: Array<{ spanId?: string; profileId?: string; value: number; spanName?: string }>) {
  return {
    series: [
      {
        labels: [],
        slots: [
          {
            exemplars: exemplars.map(({ spanId, profileId, value, spanName }) => ({
              spanId,
              profileId: profileId ?? 'profile-1',
              timestamp: 1_000,
              value,
              labels: spanName ? [{ name: 'span_name', value: spanName }] : [],
            })),
          },
        ],
      },
    ],
  };
}

describe('fetchSpanIdOptions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    buildSpanHeatmapQuery.mockReturnValue({ dataSourceUid: 'ds-uid', request: {}, profileTypeId: 'x', signature: 's' });
  });

  it('returns one option per span, labelled by ID and described by span name', async () => {
    selectHeatmap.mockResolvedValue(
      buildResponse([
        { spanId: 'span-a', value: 30, spanName: 'GET /' },
        { spanId: 'span-b', value: 20 },
      ])
    );

    await expect(fetchSpanIdOptions(scene)).resolves.toEqual([
      { value: 'span-a', label: 'span-a', description: 'GET /' },
      { value: 'span-b', label: 'span-b', description: undefined },
    ]);
  });

  it('keeps the heaviest occurrence of a span that appears more than once', async () => {
    selectHeatmap.mockResolvedValue(
      buildResponse([
        { spanId: 'span-a', value: 30, spanName: 'heaviest' },
        { spanId: 'span-a', value: 10, spanName: 'lighter' },
      ])
    );

    const options = await fetchSpanIdOptions(scene);

    expect(options).toHaveLength(1);
    expect(options[0].description).toBe('heaviest');
  });

  it('skips exemplars that have no span ID', async () => {
    selectHeatmap.mockResolvedValue(
      buildResponse([
        { profileId: 'profile-only', value: 30 },
        { spanId: 'span-a', value: 20 },
      ])
    );

    await expect(fetchSpanIdOptions(scene)).resolves.toEqual([
      { value: 'span-a', label: 'span-a', description: undefined },
    ]);
  });

  it('caps the number of options', async () => {
    selectHeatmap.mockResolvedValue(
      buildResponse(Array.from({ length: 10 }, (_, index) => ({ spanId: `span-${index}`, value: 10 - index })))
    );

    await expect(fetchSpanIdOptions(scene, 3)).resolves.toHaveLength(3);
  });

  it('does not query when the scene has no complete profile query yet', async () => {
    buildSpanHeatmapQuery.mockReturnValue(undefined);

    await expect(fetchSpanIdOptions(scene)).resolves.toEqual([]);
    expect(selectHeatmap).not.toHaveBeenCalled();
  });
});
