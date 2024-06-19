import {
  DataQueryRequest,
  DataQueryResponse,
  dateTimeParse,
  FieldType,
  LegacyMetricFindQueryOptions,
  LoadingState,
  MetricFindValue,
  ScopedVar,
  ScopedVars,
  TestDataSourceResponse,
  TimeRange,
} from '@grafana/data';
import { RuntimeDataSource, sceneGraph } from '@grafana/scenes';
import { isPrivateLabel } from '@shared/components/QueryBuilder/domain/helpers/isPrivateLabel';
import { labelsRepository } from '@shared/components/QueryBuilder/infrastructure/labelsRepository';

import { buildPyroscopeQuery } from './buildPyroscopeQuery';

export class LabelsDataSource extends RuntimeDataSource {
  static MAX_TIMESERIES_LABEL_VALUES = 10;

  static formatItemLabel(labelName: string, labelValuesCount: number) {
    return labelValuesCount > LabelsDataSource.MAX_TIMESERIES_LABEL_VALUES
      ? `${labelName} (${LabelsDataSource.MAX_TIMESERIES_LABEL_VALUES}+)`
      : `${labelName} (${labelValuesCount})`;
  }

  static buildPyroscopeQuery(scopedVars: ScopedVars) {
    const queryRunner = (scopedVars.__sceneObject as ScopedVar).value;

    const serviceName = sceneGraph.interpolate(queryRunner, '$serviceName');
    const profileMetricId = sceneGraph.interpolate(queryRunner, '$profileMetricId');

    return {
      query: buildPyroscopeQuery({ serviceName, profileMetricId }),
      serviceName,
      profileMetricId,
    };
  }

  async query(request: DataQueryRequest): Promise<DataQueryResponse> {
    const {
      query: pyroscopeQuery,
      serviceName,
      profileMetricId,
    } = LabelsDataSource.buildPyroscopeQuery(request.scopedVars);

    const timeRange = request.range;
    const from = dateTimeParse(timeRange.from.valueOf()).unix() * 1000;
    const to = dateTimeParse(timeRange.to.valueOf()).unix() * 1000;

    const queryRunner = (request.scopedVars.__sceneObject as ScopedVar).value;
    const groupByLabel = sceneGraph.interpolate(queryRunner, '$groupBy');

    if (groupByLabel !== 'all') {
      const labelValues = await labelsRepository.listLabelValues(groupByLabel, pyroscopeQuery, from, to);

      const values = labelValues.map(({ value, label }, index) => ({
        index,
        value,
        label,
        queryRunnerParams: {
          serviceName,
          profileMetricId,
          filters: [{ key: groupByLabel, operator: '=', value }],
        },
      }));

      return {
        state: LoadingState.Done,
        data: [
          {
            name: 'Labels',
            fields: [
              {
                name: 'Label',
                type: FieldType.other,
                values,
                config: {},
              },
            ],
            length: values.length,
          },
        ],
      };
    }

    const labels = await labelsRepository.listLabels(pyroscopeQuery, from, to);

    const labelsWithCounts = await Promise.all(
      labels.map(async ({ value, label: text }) => {
        const labelValues = await labelsRepository.listLabelValues(value as string, pyroscopeQuery, from, to);
        return {
          value,
          text,
          labelValues,
          count: labelValues.length,
        };
      })
    );

    const values = labelsWithCounts
      .sort((a, b) => b.count - a.count)
      .map(({ value, text, count, labelValues }, index) => {
        const allValues = labelValues.map(({ value }) => value);

        return {
          index,
          value,
          label: LabelsDataSource.formatItemLabel(text, count),
          queryRunnerParams: {
            serviceName,
            profileMetricId,
            groupBy: {
              label: value,
              values: allValues.slice(0, LabelsDataSource.MAX_TIMESERIES_LABEL_VALUES),
              allValues,
            },
          },
        };
      });

    return {
      state: LoadingState.Done,
      data: [
        {
          name: 'Labels',
          fields: [
            {
              name: 'Label',
              type: FieldType.other,
              values,
              config: {},
            },
          ],
          length: values.length,
        },
      ],
    };
  }

  async metricFindQuery(query: string, options: LegacyMetricFindQueryOptions): Promise<MetricFindValue[]> {
    // TODO: use variables, query, interpolateVariablesInQuery?
    const { query: pyroscopeQuery } = LabelsDataSource.buildPyroscopeQuery(options?.scopedVars!);

    const timeRange = options.range as TimeRange;
    const from = dateTimeParse(timeRange.from.valueOf()).unix() * 1000;
    const to = dateTimeParse(timeRange.to.valueOf()).unix() * 1000;

    const labels = await labelsRepository.listLabels(pyroscopeQuery, from, to);

    const labelsWithCounts = await Promise.all(
      labels
        .filter(({ value }) => !isPrivateLabel(value))
        .sort((a, b) => a.label.localeCompare(b.label))
        .map(async ({ value }) => {
          const labelValues = await labelsRepository.listLabelValues(value, pyroscopeQuery, from, to);
          const count = labelValues.length;
          return {
            value,
            text: `${value} (${count})`,
            count,
          };
        })
    );

    return [
      // we have to do this here because GroupByVariable seems to set its value to the 1st element at some point (?!)
      { value: 'all', text: 'All' },
      ...labelsWithCounts.sort((a, b) => b.count - a.count).map(({ value, text }) => ({ value, text })),
    ];
  }

  async testDatasource(): Promise<TestDataSourceResponse> {
    return {
      status: 'success',
      message: 'OK',
    };
  }
}
