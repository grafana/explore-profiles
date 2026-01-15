import { DataFrame, DataLinkClickEvent, DataTopic, Field } from '@grafana/data';
import { CustomTransformerDefinition, sceneGraph, SceneObject } from '@grafana/scenes';
import { merge } from 'lodash';
import { map, Observable } from 'rxjs';

import { EventViewServiceFlameGraph } from '../../../domain/events/EventViewServiceFlameGraph';
import { ProfileIdSelectorVariable } from '../../../domain/variables/ProfileIdSelectorVariable';
import { SceneExploreServiceFlameGraph } from '../../SceneExploreServiceFlameGraph/SceneExploreServiceFlameGraph';
import { GridItemData } from '../types/GridItemData';

// General note: because (e.g.) SceneLabelValuesTimeseries sets the data provider in its constructor, data can come as undefined, hence all the optional chaining operators
// in the transformers below

export const addRefId = () => (source: Observable<DataFrame[]>) =>
  source.pipe(map((data: DataFrame[]) => data?.map((d, i) => merge(d, { refId: `${d.refId}-${i}` }))));

export const addStats = () => (source: Observable<DataFrame[]>) =>
  source.pipe(
    map((data: DataFrame[]) => {
      const totalSeriesCount = data?.length;

      // TODO: in case of a groupBy query, find a way to always add a rank to each label value (based on allValuesSum) so that we can use it as startColorIndex to
      // always display each series consistently in the same color regardless of it's timseries, bar gauges with sums, or tables with maxima
      return data?.map((d) => {
        let maxValue = Number.NEGATIVE_INFINITY;

        const allValuesSum = d.fields
          ?.find((field) => field.type === 'number')
          ?.values.reduce((acc: number, value: number) => {
            if (value > maxValue) {
              maxValue = value;
            }
            return acc + value;
          }, 0);

        return merge(d, {
          meta: {
            stats: [
              {
                displayName: 'totalSeriesCount',
                value: totalSeriesCount,
              },
              {
                displayName: 'allValuesSum',
                value: allValuesSum,
              },
              {
                displayName: 'maxValue',
                value: maxValue,
              },
            ],
          },
        });
      });
    })
  );

const extractProfileIdFromHref = (href: string | undefined): string | null => {
  if (!href || !href.includes('#')) {
    return null;
  }
  const profileId = href.split('#')[1];
  return profileId && profileId !== '' ? profileId : null;
};

const showExemplarOnClickHandler = (sceneObject: SceneObject, item: GridItemData) => {
  return (event: DataLinkClickEvent<any>) => {
    event.e?.stopPropagation();
    const target = event.e?.target;
    const parentElement = target instanceof HTMLElement ? target.parentElement?.parentElement : null;
    const parentAnchorHref = parentElement instanceof HTMLAnchorElement ? parentElement.href : undefined;
    const profileId = extractProfileIdFromHref(parentAnchorHref);

    if (profileId) {
      const isFlamegraphView = sceneObject.parent?.parent instanceof SceneExploreServiceFlameGraph;
      if (isFlamegraphView) {
        sceneGraph
          .findByKeyAndType(sceneObject, 'profileIdSelector', ProfileIdSelectorVariable)
          .changeValueTo(profileId);
      } else {
        sceneObject.publishEvent(
          new EventViewServiceFlameGraph({
            item: {
              ...item,
              queryRunnerParams: {
                ...item.queryRunnerParams,
                profileIdSelector: profileId,
              },
            },
          }),
          true
        );
      }
    }
  };
};

export const addExemplarLinks = (sceneObject: SceneObject, item: GridItemData): CustomTransformerDefinition => ({
  topic: DataTopic.Annotations,
  operator: () => (source: Observable<DataFrame[]>) => {
    return source.pipe(
      map((data: DataFrame[]) =>
        data.map((frame) => {
          if (frame.name !== 'exemplar') {
            return frame;
          }

          const profileIdField = frame.fields.find((field: Field) => field.name === 'Id');
          if (!profileIdField) {
            return frame;
          }

          profileIdField.config.links = [
            {
              title: 'View profile',
              url: '#${__value.raw}',
              onClick: showExemplarOnClickHandler(sceneObject, item),
            },
          ];

          return frame;
        })
      )
    );
  },
});
