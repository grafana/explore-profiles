import { DataFrame } from '@grafana/data';
import { merge } from 'lodash';
import { map, Observable } from 'rxjs';

import { getSeriesStatsValue } from '../../../infrastructure/helpers/getSeriesStatsValue';
import { LabelsDataSource } from '../../../infrastructure/labels/LabelsDataSource';

// General note: because (e.g.) SceneLabelValuesTimeseries sets the data provider in its constructor, data can come as undefined, hence all the optional chaining operators
// in the transformers below

export const addRefId = () => (source: Observable<DataFrame[]>) =>
  source.pipe(map((data: DataFrame[]) => data?.map((d, i) => merge(d, { refId: `${d.refId}-${i}` }))));

export const addStats = () => (source: Observable<DataFrame[]>) =>
  source.pipe(
    map((data: DataFrame[]) => {
      const totalSeriesCount = data?.length;

      return data?.map((d) => {
        const allValuesSum = d.fields
          ?.find((field) => field.type === 'number')
          ?.values.reduce((acc: number, value: number) => acc + value, 0);

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
            ],
          },
        });
      });
    })
  );

// depends on the "addStats" transformation to work properly
export const sortSeries = () => (source: Observable<DataFrame[]>) =>
  source.pipe(
    map((data: DataFrame[]) =>
      data?.sort((d1, d2) => {
        const d1Sum = getSeriesStatsValue(d1, 'allValuesSum') || 0;
        const d2Sum = getSeriesStatsValue(d2, 'allValuesSum') || 0;
        return d2Sum - d1Sum;
      })
    )
  );

export const limitNumberOfSeries = () => (source: Observable<DataFrame[]>) =>
  source.pipe(map((data: DataFrame[]) => data?.slice(0, LabelsDataSource.MAX_TIMESERIES_LABEL_VALUES)));
