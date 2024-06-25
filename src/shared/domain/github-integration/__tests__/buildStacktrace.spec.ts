import { DataFrame, FieldType } from '@grafana/data';

import { buildStacktrace } from '../buildStacktrace';

const buildLevelItem = (level: number, itemIndexes: number[], parents: any[]): any => ({
  level,
  itemIndexes,
  parents,
  start: 0,
  value: 0,
  valueRight: 0,
  children: [],
});

const DATA_FRAME: DataFrame = {
  name: 'response',
  fields: [{ name: 'label', type: FieldType.string, values: ['top', 'one', 'two'], config: {} }],
  length: 42,
  meta: {},
};

describe('buildStacktrace(levelItem, labels)', () => {
  describe('top-level item (level = 0)', () => {
    it('returns an empty array', () => {
      const levelItem = buildLevelItem(0, [], []);

      expect(buildStacktrace(levelItem, DATA_FRAME)).toEqual([]);
    });
  });

  describe('item at level 1', () => {
    it('returns the correct stack trace', () => {
      const topLevelItem = buildLevelItem(0, [], []);
      const levelItem = buildLevelItem(1, [1], [topLevelItem]);

      expect(buildStacktrace(levelItem, DATA_FRAME)).toEqual(['one']);
    });
  });

  describe('item at level 2', () => {
    it('returns the correct stack trace', () => {
      const topLevelItem = buildLevelItem(0, [], []);
      const levelOneItem = buildLevelItem(1, [1], [topLevelItem]);
      const levelItem = buildLevelItem(2, [2], [levelOneItem]);

      expect(buildStacktrace(levelItem, DATA_FRAME)).toEqual(['one', 'two']);
    });
  });
});
