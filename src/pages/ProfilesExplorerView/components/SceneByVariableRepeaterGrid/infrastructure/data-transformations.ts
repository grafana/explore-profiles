import { DataFrame } from '@grafana/data';
import { merge } from 'lodash';
import { map, Observable } from 'rxjs';

import { LabelsDataSource } from '../../../infrastructure/labels/LabelsDataSource';

// Note: we use the optional chaining operator at the start of each transformation because in some cases, it comes as undefined
// For example, landing on "Labels" with a group by value and the "Single" layout type

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
        const d1Sum = d1.meta?.stats?.find(({ displayName }) => displayName === 'allValuesSum')?.value || 0;
        const d2Sum = d2.meta?.stats?.find(({ displayName }) => displayName === 'allValuesSum')?.value || 0;
        return d2Sum - d1Sum;
      })
    )
  );

export const limitNumberOfSeries = () => (source: Observable<DataFrame[]>) =>
  source.pipe(map((data: DataFrame[]) => data?.slice(0, LabelsDataSource.MAX_TIMESERIES_LABEL_VALUES)));
