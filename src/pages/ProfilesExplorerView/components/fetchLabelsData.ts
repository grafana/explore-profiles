import { labelsRepository } from '@shared/components/QueryBuilder/infrastructure/labelsRepository';
import { userStorage } from '@shared/infrastructure/userStorage';

export async function fetchLabelsData(query: string, from: number, to: number) {
  const labels = await labelsRepository.listLabels(query, from, to);

  const labelsData = await Promise.all(
    labels.map(async (label) => {
      const values = await labelsRepository.listLabelValues(label.value, query, from, to);
      return {
        id: label.value,
        values: values.map(({ value }) => value),
      };
    })
  );

  const storage = userStorage.get(userStorage.KEYS.PROFILES_EXPLORER);
  const pinnedLabels = storage?.pinnedLabels || [];

  return labelsData.sort((a, b) => {
    if (pinnedLabels.includes(a.id)) {
      return -1;
    }
    if (pinnedLabels.includes(b.id)) {
      return +1;
    }
    return 0;
  });
}
