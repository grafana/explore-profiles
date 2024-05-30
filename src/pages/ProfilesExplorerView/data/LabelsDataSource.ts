import {
  DataQueryRequest,
  DataQueryResponse,
  dateTimeParse,
  FieldType,
  LegacyMetricFindQueryOptions,
  LoadingState,
  MetricFindValue,
  ScopedVar,
  TestDataSourceResponse,
  TimeRange,
} from '@grafana/data';
import { RuntimeDataSource, sceneGraph } from '@grafana/scenes';
import { isPrivateLabel } from '@shared/components/QueryBuilder/domain/helpers/isPrivateLabel';
import { labelsRepository } from '@shared/components/QueryBuilder/infrastructure/labelsRepository';

import { ProfileMetricsDataSource } from './ProfileMetricsDataSource';

export class LabelsDataSource extends RuntimeDataSource {
  static MAX_TIMESERIES_LABEL_VALUES = 10;

  static buildPyroscopeQuery({ serviceName, profileMetricId }: { serviceName: string; profileMetricId: string }) {
    return `${profileMetricId}{service_name="${serviceName}"}`;
  }

  async query(request: DataQueryRequest): Promise<DataQueryResponse> {
    const queryRunner = (request.scopedVars.__sceneObject as ScopedVar).value;

    const serviceName = sceneGraph.interpolate(queryRunner, '$serviceName');
    const profileMetricId = sceneGraph.interpolate(queryRunner, '$profileMetricId');

    const scopedVars = {
      serviceName: {
        value: serviceName,
        text: serviceName,
      },
      profileMetricId: {
        value: profileMetricId,
        text: ProfileMetricsDataSource.getProfileMetricLabel(profileMetricId),
      },
    };

    const timeRange = request.range;
    const labels = await this.metricFindQuery('list', { range: timeRange, scopedVars });

    const pyroscopeQuery = LabelsDataSource.buildPyroscopeQuery({ serviceName, profileMetricId });
    const from = dateTimeParse(timeRange.from.valueOf()).unix() * 1000;
    const to = dateTimeParse(timeRange.to.valueOf()).unix() * 1000;

    const labelsWithCounts = await Promise.all(
      labels.map(async ({ value, text }) => {
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
      .map(({ value, text, count, labelValues }) => ({
        value,
        label:
          count > LabelsDataSource.MAX_TIMESERIES_LABEL_VALUES
            ? `${text} (${LabelsDataSource.MAX_TIMESERIES_LABEL_VALUES}+)`
            : `${text} (${count})`,
        queryRunnerParams: {
          serviceName,
          profileMetricId,
          groupBy: {
            label: value,
            values: labelValues.slice(0, LabelsDataSource.MAX_TIMESERIES_LABEL_VALUES).map(({ value }) => value),
          },
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

  async metricFindQuery(query: string, options: LegacyMetricFindQueryOptions): Promise<MetricFindValue[]> {
    const { serviceName, profileMetricId } = options.scopedVars || {};
    const pyroscopeQuery = LabelsDataSource.buildPyroscopeQuery({
      serviceName: serviceName?.value,
      profileMetricId: profileMetricId?.value,
    });

    const timeRange = options.range as TimeRange;
    const from = dateTimeParse(timeRange.from.valueOf()).unix() * 1000;
    const to = dateTimeParse(timeRange.to.valueOf()).unix() * 1000;

    const labels = await labelsRepository.listLabels(pyroscopeQuery, from, to);

    return labels
      .filter(({ value }) => !isPrivateLabel(value))
      .sort((a, b) => a.label.localeCompare(b.label))
      .map((l) => ({
        text: l.label,
        value: l.value,
      }));
  }

  async testDatasource(): Promise<TestDataSourceResponse> {
    return {
      status: 'success',
      message: 'OK',
    };
  }
}
