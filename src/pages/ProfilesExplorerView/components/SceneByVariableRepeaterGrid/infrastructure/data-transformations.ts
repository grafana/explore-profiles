import { DataFrame } from '@grafana/data';
import { merge } from 'lodash';
import { map, Observable } from 'rxjs';

import { getSeriesStatsValue } from '../../../infrastructure/helpers/getSeriesStatsValue';
import { LabelsDataSource } from '../../../infrastructure/labels/LabelsDataSource';

export type StatName = 'totalSeriesCount' | 'allValuesSum' | 'maxValue';

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

// depends on the "addStats" transformation above to work properly
export const sortSeries = (statName: StatName) => () => (source: Observable<DataFrame[]>) =>
  source.pipe(
    map((data: DataFrame[]) =>
      data?.sort((d1, d2) => {
        const v1 = getSeriesStatsValue(d1, statName) || 0;
        const v2 = getSeriesStatsValue(d2, statName) || 0;
        return v2 - v1;
      })
    )
  );

export const limitNumberOfSeries = () => (source: Observable<DataFrame[]>) =>
  source.pipe(map((data: DataFrame[]) => data?.slice(0, LabelsDataSource.MAX_TIMESERIES_LABEL_VALUES)));
