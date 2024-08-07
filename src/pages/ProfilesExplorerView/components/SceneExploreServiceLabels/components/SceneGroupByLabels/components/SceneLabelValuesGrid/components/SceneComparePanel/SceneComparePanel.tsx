import { SceneComponentProps, SceneObjectBase, SceneObjectState } from '@grafana/scenes';
import React from 'react';

import { EventSelectForCompare } from '../../../../../../domain/events/EventSelectForCompare';
import { GridItemDataWithStats } from '../../SceneLabelValuesGrid';
import { ComparePanel, CompareTarget } from './ui/ComparePanel';

interface SceneComparePanelState extends SceneObjectState {
  item: GridItemDataWithStats;
  compareTargetValue?: CompareTarget;
}

export class SceneComparePanel extends SceneObjectBase<SceneComparePanelState> {
  static WIDTH_IN_PIXELS = 180;

  static buildPanelKey(item: GridItemDataWithStats) {
    return `compare-panel-${item.value}`;
  }

  constructor({ item, compareTargetValue }: { item: GridItemDataWithStats; compareTargetValue?: CompareTarget }) {
    super({
      key: SceneComparePanel.buildPanelKey(item),
      item,
      compareTargetValue,
    });
  }

  updateCompareTargetValue(compareTargetValue?: CompareTarget) {
    this.setState({ compareTargetValue });
  }

  getStats() {
    return this.state.item.stats;
  }

  updateStats(stats: GridItemDataWithStats['stats']) {
    const { item } = this.state;
    this.setState({ item: { ...item, stats } });
  }

  onChangeCompareTarget = (compareTarget: CompareTarget) => {
    const { item } = this.state;
    this.publishEvent(new EventSelectForCompare({ compareTarget, item }), true);
  };

  static Component({ model }: SceneComponentProps<SceneComparePanel>) {
    const { item, compareTargetValue } = model.useState();

    return (
      <ComparePanel
        item={item}
        compareTargetValue={compareTargetValue}
        onChangeCompareTarget={model.onChangeCompareTarget}
      />
    );
  }
}
