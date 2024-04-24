import { TimeRange } from '@grafana/data';
import { isPrivateLabel } from '@shared/components/QueryBuilder/domain/helpers/isPrivateLabel';
import { labelsRepository } from '@shared/components/QueryBuilder/infrastructure/labelsRepository';

export async function fetchLabelsData(query: string, timeRange: TimeRange) {
  const from = timeRange.from.unix() * 1000;
  const to = timeRange.to.unix() * 1000;

  const labels = await labelsRepository.listLabels(query, from, to);

  const labelsData = await Promise.all(
    labels
      .filter(({ value }) => !isPrivateLabel(value))
      .map(async (label) => {
        const values = await labelsRepository.listLabelValues(label.value, query, from, to);
        return {
          id: label.value,
          values: values.map(({ value }) => value),
        };
      })
  );

  return labelsData;
}
