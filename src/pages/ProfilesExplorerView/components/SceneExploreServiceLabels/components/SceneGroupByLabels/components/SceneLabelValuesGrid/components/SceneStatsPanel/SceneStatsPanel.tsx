import { SceneComponentProps, sceneGraph, SceneObjectBase, SceneObjectState } from '@grafana/scenes';
import React from 'react';

import { GridItemData } from '../../../../../../../SceneByVariableRepeaterGrid/types/GridItemData';
import { EventSelectForCompare } from '../../../../domain/events/EventSelectForCompare';
import { SceneGroupByLabels } from '../../../../SceneGroupByLabels';
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

  constructor({ item }: { item: GridItemData }) {
    super({
      item,
      itemStats: undefined,
      compareTargetValue: undefined,
    });

    this.addActivationHandler(this.onActivate.bind(this));
  }

  onActivate() {
    const compare = sceneGraph.findByKeyAndType(this, 'group-by-labels', SceneGroupByLabels).getCompare();

    this.setCompareTargetValue(compare.get(CompareTarget.BASELINE), compare.get(CompareTarget.COMPARISON));
  }

  setCompareTargetValue(baselineItem?: GridItemData, comparisonItem?: GridItemData) {
    const { item } = this.state;
    let compareTargetValue;

    if (baselineItem?.value === item.value) {
      compareTargetValue = CompareTarget.BASELINE;
    } else if (comparisonItem?.value === item.value) {
      compareTargetValue = CompareTarget.COMPARISON;
    }

    this.setState({ compareTargetValue });
  }

  onChangeCompareTarget = (compareTarget: CompareTarget) => {
    this.publishEvent(
      new EventSelectForCompare({
        compareTarget,
        item: this.state.item,
      }),
      true
    );
  };

  getStats() {
    return this.state.itemStats;
  }

  updateStats(itemStats: ItemStats) {
    this.setState({ itemStats });
  }

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
