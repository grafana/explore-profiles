import { DataFrame } from '@grafana/data';
import { LevelItem } from '@shared/components/@grafana-experimental-flamegraph/src/FlameGraph/dataTransform';

import { StackTrace } from '../components/FunctionDetailsPanel/types/StackTrace';

export function buildStacktrace(levelItem: LevelItem, data: DataFrame): StackTrace {
  const labels: string[] = data.fields.find(({ name }) => name === 'label')?.values || [];

  let stacktrace = [];

  let node: LevelItem | undefined = levelItem;

  while (node && node.level > 0) {
    for (const idx of node.itemIndexes) {
      stacktrace.unshift(labels[idx]);
    }

    node = node.parents?.[0];
  }

  return stacktrace;
}
