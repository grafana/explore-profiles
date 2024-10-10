import { createDataFrame, DataFrameDTO, FieldType } from '@grafana/data';

// eslint-disable-next-line sonarjs/cognitive-complexity
function getNodes(level: number[], names: string[], diff: boolean) {
  const nodes = [];
  const itemOffset = diff ? 7 : 4;

  for (let i = 0; i < level.length; i += itemOffset) {
    nodes.push({
      level: 0,
      label: diff ? names[level[i + 6]] : names[level[i + 3]],
      offset: level[i],
      val: level[i + 1],
      self: level[i + 2],
      selfRight: diff ? level[i + 5] : 0,
      valRight: diff ? level[i + 4] : 0,
      valTotal: diff ? level[i + 1] + level[i + 4] : level[i + 1],
      offsetRight: diff ? level[i + 3] : 0,
      offsetTotal: diff ? level[i] + level[i + 3] : level[i],
      children: [],
    });
  }

  return nodes;
}

// eslint-disable-next-line sonarjs/cognitive-complexity
export function flamebearerToDataFrameDTO(levels: number[][], names: string[], unit: string, diff: boolean) {
  if (!levels.length) {
    return;
  }

  const nodeLevels: any[][] = [];

  for (let i = 0; i < levels.length; i++) {
    nodeLevels[i] = [];

    for (const node of getNodes(levels[i], names, diff)) {
      node.level = i;
      nodeLevels[i].push(node);

      if (i > 0) {
        const prevNodesInLevel = nodeLevels[i].slice(0, -1);
        const currentNodeStart =
          prevNodesInLevel.reduce((acc, n) => n.offsetTotal + n.valTotal + acc, 0) + node.offsetTotal;

        const prevLevel = nodeLevels[i - 1];
        let prevLevelOffset = 0;

        for (const prevLevelNode of prevLevel) {
          const parentNodeStart = prevLevelOffset + prevLevelNode.offsetTotal;
          const parentNodeEnd = parentNodeStart + prevLevelNode.valTotal;

          if (parentNodeStart <= currentNodeStart && parentNodeEnd > currentNodeStart) {
            prevLevelNode.children.push(node);
            break;
          } else {
            prevLevelOffset += prevLevelNode.offsetTotal + prevLevelNode.valTotal;
          }
        }
      }
    }
  }

  const root = nodeLevels[0][0];
  const stack = [root];

  const labelValues = [];
  const levelValues = [];
  const selfValues = [];
  const valueValues = [];
  const selfRightValues = [];
  const valueRightValues = [];

  while (stack.length) {
    const node = stack.shift();
    labelValues.push(node.label);
    levelValues.push(node.level);
    selfValues.push(node.self);
    valueValues.push(node.val);
    selfRightValues.push(node.selfRight);
    valueRightValues.push(node.valRight);
    stack.unshift(...node.children);
  }

  let valueUnit = 'short';

  // See format.ts#getFormatter. We have to use Grafana unit string here though.
  switch (unit) {
    case 'samples':
    case 'trace_samples':
    case 'lock_nanoseconds':
    case 'nanoseconds':
      valueUnit = 'ns';
      break;
    case 'bytes':
      valueUnit = 'bytes';
      break;
  }

  const fields = [
    { name: 'level', values: levelValues },
    { name: 'label', values: labelValues, type: FieldType.string },
    { name: 'self', values: selfValues, config: { unit: valueUnit } },
    { name: 'value', values: valueValues, config: { unit: valueUnit } },
  ];

  if (diff) {
    fields.push(
      ...[
        {
          name: 'selfRight',
          values: selfRightValues,
          config: { unit: valueUnit },
        },
        {
          name: 'valueRight',
          values: valueRightValues,
          config: { unit: valueUnit },
        },
      ]
    );
  }

  const frame: DataFrameDTO = {
    name: 'response',
    meta: { preferredVisualisationType: 'flamegraph' },
    fields,
  };

  return createDataFrame(frame);
}
