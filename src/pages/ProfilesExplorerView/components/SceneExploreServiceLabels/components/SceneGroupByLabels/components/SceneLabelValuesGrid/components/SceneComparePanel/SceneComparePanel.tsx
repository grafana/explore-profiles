import { SceneComponentProps, SceneObjectBase, SceneObjectState } from '@grafana/scenes';
import React from 'react';

import { GridItemData } from '../../../../../../../SceneByVariableRepeaterGrid/types/GridItemData';
import { EventSelectForCompare } from '../../../../../../domain/events/EventSelectForCompare';
import { ComparePanel, CompareTarget } from './ui/ComparePanel';

export type ItemStats = {
  allValuesSum: number;
  unit: string;
};

interface SceneComparePanelState extends SceneObjectState {
  item: GridItemData;
  itemStats?: ItemStats;
  compareTargetValue?: CompareTarget;
}

export class SceneComparePanel extends SceneObjectBase<SceneComparePanelState> {
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

  getItemStats() {
    return this.state.itemStats;
  }

  updateStats(itemStats: ItemStats) {
    this.setState({ itemStats });
  }

  onChangeCompareTarget = (compareTarget: CompareTarget) => {
    const { item } = this.state;
    this.publishEvent(new EventSelectForCompare({ compareTarget, item }), true);
  };

  static Component({ model }: SceneComponentProps<SceneComparePanel>) {
    const { item, itemStats, compareTargetValue } = model.useState();

    return (
      <ComparePanel
        item={item}
        itemStats={itemStats}
        compareTargetValue={compareTargetValue}
        onChangeCompareTarget={model.onChangeCompareTarget}
      />
    );
  }
}
