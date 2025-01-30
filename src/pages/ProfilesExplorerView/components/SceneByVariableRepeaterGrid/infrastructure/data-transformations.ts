import { DataFrame } from '@grafana/data';
import { merge } from 'lodash';
import { map, Observable } from 'rxjs';

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
