import { DataFrame, FieldType } from '@grafana/data';
import { getProfileMetric, ProfileMetricId } from '@shared/infrastructure/profile-metrics/getProfileMetric';
import { merge } from 'lodash';
import { map, Observable } from 'rxjs';

// General note: because (e.g.) SceneLabelValuesTimeseries sets the data provider in its constructor, data can come as undefined, hence all the optional chaining operators
// in the transformers below

function getProfileMetricId(frame?: DataFrame): ProfileMetricId | undefined {
  if (!frame) {
    return undefined;
  }

  return tryFromQueryString(frame) || tryFromCustomMeta(frame) || tryFromProfileLabel(frame) || tryFromRefId(frame);
}

function tryFromQueryString(frame: DataFrame): ProfileMetricId | undefined {
  const queryString = frame.meta?.executedQueryString;
  if (!queryString) {
    return undefined;
  }

  const match = queryString.match(/profileTypeId:\s*([^\s,}]+)/);
  return match?.[1] as ProfileMetricId;
}

function tryFromCustomMeta(frame: DataFrame): ProfileMetricId | undefined {
  return frame.meta?.custom?.profileMetricId;
}

function tryFromProfileLabel(frame: DataFrame): ProfileMetricId | undefined {
  return frame.fields?.[0]?.labels?.['__profile_type__'] as ProfileMetricId;
}

function tryFromRefId(frame: DataFrame): ProfileMetricId | undefined {
  if (!frame.refId) {
    return undefined;
  }

  const match = frame.refId.match(/^([^-]+)-/);
  if (match?.[1] && !match[1].startsWith('$')) {
    return match[1] as ProfileMetricId;
  }
  return undefined;
}

function determineMetricTypeFromFields(frame?: DataFrame): { isCumulative: boolean; unit: string } {
  if (!frame?.fields) {
    return { isCumulative: false, unit: '' };
  }

  const valueField = frame.fields.find((f) => f.type === 'number');
  if (!valueField) {
    return { isCumulative: false, unit: '' };
  }

  const fieldName = valueField.name.toLowerCase();
  const unit = valueField.config?.unit || '';

  const cumulativePatterns = ['alloc_space', 'alloc_objects', 'cpu', 'delay', 'lock_time', 'contentions'];
  const isCumulative = cumulativePatterns.some((pattern) => fieldName.includes(pattern));

  return { isCumulative, unit };
}

function determineCumulativeFromMetadata(data: DataFrame[]): { isCumulative: boolean; profileUnit: string } {
  const profileMetricId = getProfileMetricId(data[0]);

  if (profileMetricId) {
    const profileMetric = getProfileMetric(profileMetricId);
    return {
      isCumulative: (profileMetric as any).aggregationType === 'cumulative',
      profileUnit: profileMetric.unit,
    };
  }

  const fallbackResult = determineMetricTypeFromFields(data[0]);
  return {
    isCumulative: fallbackResult.isCumulative,
    profileUnit: fallbackResult.unit,
  };
}

function calculateCumulativeTotal(valueFields: any[]): number {
  const primaryValueField = valueFields[0];
  if (!primaryValueField?.values?.length) {
    return 0;
  }

  return primaryValueField.values.reduce((acc: number, value: number) => acc + value, 0);
}

function transformFieldToRate(field: any, stepDurationSec: number, profileUnit: string): any {
  if (field.type !== FieldType.number) {
    return field;
  }

  const fieldUnit = field.config?.unit || profileUnit;
  const rateUnit = getRateUnitForField(fieldUnit, field.name);

  let rateValues = field.values.map((value: number) => value / stepDurationSec);

  if (field.name.toLowerCase() === 'cpu' && fieldUnit === 'ns') {
    rateValues = rateValues.map((v: number) => v / 1000000000);
  }

  return {
    ...field,
    values: rateValues,
    config: {
      ...field.config,
      unit: rateUnit,
    },
  };
}

function updateFrameStats(frame: DataFrame, cumulativeTotal: number, stepDurationSec: number): any {
  const existingStats = frame.meta?.stats || [];
  const updatedStats = [
    ...existingStats.filter((stat: any) => stat.displayName !== 'cumulativeTotal'),
    {
      displayName: 'cumulativeTotal',
      value: cumulativeTotal,
    },
  ];

  return {
    ...frame.meta,
    stats: updatedStats,
    custom: {
      ...frame.meta?.custom,
      stepDurationSec,
      isCumulative: true,
    },
  };
}

function processFrameForRate(frame: DataFrame, profileUnit: string): DataFrame {
  const timeField = frame.fields.find((f) => f.type === FieldType.time);
  const valueFields = frame.fields.filter((f) => f.type === FieldType.number);

  if (!timeField || !valueFields.length || timeField.values.length < 2) {
    return frame;
  }

  const times = timeField.values as number[];
  const stepDurationMs = times[1] - times[0];
  const stepDurationSec = stepDurationMs / 1000;

  const cumulativeTotal = calculateCumulativeTotal(valueFields);

  const updatedFields = frame.fields.map((field) => transformFieldToRate(field, stepDurationSec, profileUnit));

  return {
    ...frame,
    fields: updatedFields,
    meta: updateFrameStats(frame, cumulativeTotal, stepDurationSec),
  } as DataFrame;
}

function getRateUnitForField(fieldUnit: string, fieldName: string): string {
  const isCpuTimeField = fieldName.toLowerCase() === 'cpu' && fieldUnit === 'ns';

  if (isCpuTimeField) {
    return 's/s';
  }

  switch (fieldUnit) {
    case 'ns':
      return 'ns';
    case 'bytes':
      return 'binBps';
    case 'short':
      return 'ops';
    default:
      return fieldUnit;
  }
}

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

        // Preserve cumulative totals if they exist in meta
        const existingStats = d.meta?.stats || [];
        const cumulativeTotal = existingStats.find((stat: any) => stat.displayName === 'cumulativeTotal');

        const stats = [
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
        ];

        // Preserve cumulative total if it exists
        if (cumulativeTotal) {
          stats.push(cumulativeTotal);
        }

        return merge(d, {
          meta: {
            stats,
          },
        });
      });
    })
  );

export const addRateCalculation = () => (source: Observable<DataFrame[]>) =>
  source.pipe(
    map((data: DataFrame[]) => {
      if (!data?.length) {
        return data;
      }

      try {
        const { isCumulative, profileUnit } = determineCumulativeFromMetadata(data);

        if (!isCumulative) {
          return data;
        }

        return data.map((frame) => processFrameForRate(frame, profileUnit));
      } catch (error) {
        return data;
      }
    })
  );
