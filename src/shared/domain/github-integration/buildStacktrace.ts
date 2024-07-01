import { createTheme, getDisplayProcessor } from '@grafana/data';

import { StackTrace } from '../../components/FunctionDetailsPanel/types/StackTrace';

export function buildStacktrace(levelItem: any, data: any): StackTrace {
  let stacktrace: string[] = [];

  const labels = data.fields.find(({ name }: { name: string }) => name === 'label');
  if (!labels) {
    return stacktrace;
  }

  const dp = getDisplayProcessor({ field: labels, theme: createTheme() });
  let node = levelItem;

  while (node && node.level > 0) {
    for (const idx of node.itemIndexes) {
      stacktrace.unshift(dp(labels.values[idx]).text);
    }

    node = node.parents?.[0];
  }

  return stacktrace;
}
