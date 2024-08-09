import { SceneComponentProps, SceneObjectBase, SceneObjectState } from '@grafana/scenes';
import React from 'react';

import { GridItemData } from '../../../../../../../SceneByVariableRepeaterGrid/types/GridItemData';
import { EventSelectForCompare } from '../../../../domain/events/EventSelectForCompare';
import { CompareTarget } from '../../domain/types';
import { StatsPanel } from './ui/StatsPanel';

export type ItemStats = {
  allValuesSum: number;
  unit: string;
};

interface SceneStatsPanelState extends SceneObjectState {
  item: GridItemData;
  itemStats?: ItemStats;
  compareTargetValue?: CompareTarget;
}

export class SceneStatsPanel extends SceneObjectBase<SceneStatsPanelState> {
  static WIDTH_IN_PIXELS = 180;

  constructor({ item, compareTargetValue }: { item: GridItemData; compareTargetValue?: CompareTarget }) {
    super({
      item,
      itemStats: undefined,
      compareTargetValue,
    });
  }

  updateCompareTargetValue(compareTargetValue?: CompareTarget) {
    this.setState({ compareTargetValue });
  }

  getStats() {
    return this.state.itemStats;
  }

  updateStats(itemStats: ItemStats) {
    this.setState({ itemStats });
  }

  onChangeCompareTarget = (compareTarget: CompareTarget) => {
    const { item } = this.state;
    this.publishEvent(new EventSelectForCompare({ compareTarget, item }), true);
  };

  static Component({ model }: SceneComponentProps<SceneStatsPanel>) {
    const { item, itemStats, compareTargetValue } = model.useState();

    return (
      <StatsPanel
        item={item}
        itemStats={itemStats}
        compareTargetValue={compareTargetValue}
        onChangeCompareTarget={model.onChangeCompareTarget}
      />
    );
  }
}
