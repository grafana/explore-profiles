import { StackTrace } from '../components/FunctionDetailsPanel/types/StackTrace';

export function buildStacktrace(levelItem: any, data: any): StackTrace {
  const labels: string[] = data.fields.find(({ name }: { name: string }) => name === 'label')?.values || [];

  let stacktrace = [];

  let node = levelItem;

  while (node && node.level > 0) {
    for (const idx of node.itemIndexes) {
      stacktrace.unshift(labels[idx]);
    }

    node = node.parents?.[0];
  }

  return stacktrace;
}
