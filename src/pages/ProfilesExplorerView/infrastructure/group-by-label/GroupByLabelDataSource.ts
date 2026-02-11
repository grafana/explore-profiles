import {
  DataQueryResponse,
  FieldType,
  LegacyMetricFindQueryOptions,
  LoadingState,
  MetricFindValue,
  TestDataSourceResponse,
  TimeRange,
} from '@grafana/data';
import { RuntimeDataSource, sceneGraph } from '@grafana/scenes';
import { labelsRepository } from '@shared/infrastructure/labels/labelsRepository';
import { logger } from '@shared/infrastructure/tracking/logger';

import { GroupByLabelValueVariable } from '../../domain/variables/GroupByVariable/GroupByLabelValueVariable';
import { computeRoundedTimeRange } from '../../helpers/computeRoundedTimeRange';
import { LabelsApiClient } from '../labels/http/LabelsApiClient';
import { PYROSCOPE_GROUP_BY_LABEL_DATA_SOURCE } from '../pyroscope-data-sources';
import { safeInterpolate } from '../series/helpers/safeInterpolate';

export class GroupByLabelDataSource extends RuntimeDataSource {
  constructor() {
    super(PYROSCOPE_GROUP_BY_LABEL_DATA_SOURCE.type, PYROSCOPE_GROUP_BY_LABEL_DATA_SOURCE.uid);
  }

  async query(): Promise<DataQueryResponse> {
    return {
      state: LoadingState.Done,
      data: [
        {
          name: 'GroupByLabelValues',
          fields: [
            {
              name: 'Label',
              type: FieldType.other,
              values: [],
              config: {},
            },
          ],
          length: 0,
        },
      ],
    };
  }

  parseQuery(query: string): { labelName: string; hierarchyLevel: number } {
    // Query format: "$dataSource labelValues <labelName> level <hierarchyLevel>"
    const match = query.match(/labelValues (\S+) level (\d+)/);
    if (!match) {
      throw new Error(`Invalid query format: ${query}`);
    }
    return {
      labelName: match[1],
      hierarchyLevel: parseInt(match[2], 10),
    };
  }

  buildHierarchyQuery(
    sceneObject: GroupByLabelValueVariable,
    profileMetricId: string,
    hierarchyLevel: number
  ): string {
    const filters: string[] = [];

    // Find all hierarchy variables with lower levels and include their values as filters
    for (let i = 0; i < hierarchyLevel; i++) {
      try {
        const parentVar = sceneGraph.findByKeyAndType(
          sceneObject,
          `groupByLabelValue-${i}`,
          GroupByLabelValueVariable
        );
        const parentValue = parentVar.state.value;
        const parentLabelName = parentVar.getLabelName();
        if (parentValue && parentValue !== '') {
          filters.push(`${parentLabelName}="${parentValue}"`);
        }
      } catch {
        // Parent variable not found, skip
      }
    }

    if (filters.length > 0) {
      return `${profileMetricId}{${filters.join(',')}}`;
    }

    return profileMetricId;
  }

  async metricFindQuery(query: string, options: LegacyMetricFindQueryOptions): Promise<MetricFindValue[]> {
    const sceneObject = options.scopedVars?.__sceneObject?.valueOf() as GroupByLabelValueVariable;

    // Don't fetch if variable is not active
    if (!sceneObject.isActive) {
      return [];
    }

    const { labelName, hierarchyLevel } = this.parseQuery(query);

    const dataSourceUid = safeInterpolate(sceneObject, '$dataSource');
    const profileMetricId = safeInterpolate(sceneObject, '$profileMetricId');

    if (!profileMetricId) {
      logger.warn(
        'GroupByLabelDataSource: profileMetricId="%s" is empty! Discarding request.',
        profileMetricId
      );
      return [];
    }

    const { from, to } = computeRoundedTimeRange(options.range as TimeRange);

    // Build the query with hierarchy filters
    const hierarchyQuery = this.buildHierarchyQuery(sceneObject, profileMetricId, hierarchyLevel);

    labelsRepository.setApiClient(new LabelsApiClient({ dataSourceUid }));

    try {
      const labelValues = await labelsRepository.listLabelValues({
        query: hierarchyQuery,
        from,
        to,
        label: labelName,
      });

      return labelValues.map(({ value, label }) => ({
        value,
        text: label,
      }));
    } catch (error) {
      logger.error(error as Error, {
        info: 'Error while loading Pyroscope label values for group by hierarchy!',
        labelName,
        hierarchyLevel: String(hierarchyLevel),
      });

      throw error;
    }
  }

  async testDatasource(): Promise<TestDataSourceResponse> {
    return {
      status: 'success',
      message: 'OK',
    };
  }
}
