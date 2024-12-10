import { SceneComponentProps, sceneGraph, SceneObjectBase, SceneObjectState } from '@grafana/scenes';
import { getProfileMetric, ProfileMetricId } from '@shared/infrastructure/profile-metrics/getProfileMetric';
import React from 'react';
import { getSceneVariableValue } from 'src/pages/ProfilesExplorerView/helpers/getSceneVariableValue';
import { getProfileMetricLabel } from 'src/pages/ProfilesExplorerView/infrastructure/series/helpers/getProfileMetricLabel';

import { GridItemData } from '../../../../../../../SceneByVariableRepeaterGrid/types/GridItemData';
import { CompareTarget } from '../../../../../../../SceneExploreDiffFlameGraph/domain/types';
import { EventSelectForCompare } from '../../../../domain/events/EventSelectForCompare';
import { SceneGroupByLabels } from '../../../../SceneGroupByLabels';
import { StatsPanel } from './ui/StatsPanel';

export type ItemStats = {
  allValuesSum: number;
  unit: string;
};

interface SceneStatsPanelState extends SceneObjectState {
  item: GridItemData;
  itemStats?: ItemStats;
  compareActionChecks: boolean[];
  statsDescription: string;
}

export class SceneStatsPanel extends SceneObjectBase<SceneStatsPanelState> {
  static WIDTH_IN_PIXELS = 186;

  constructor({ item }: { item: GridItemData }) {
    super({
      item,
      itemStats: undefined,
      compareActionChecks: [false, false],
      statsDescription: '',
    });

    this.addActivationHandler(this.onActivate.bind(this));
  }

  onActivate() {
    const compare = sceneGraph.findByKeyAndType(this, 'group-by-labels', SceneGroupByLabels).getCompare();

    this.updateCompareActions(compare.get(CompareTarget.BASELINE), compare.get(CompareTarget.COMPARISON));

    this.setState({ statsDescription: this.getStatsDescription() });
  }

  updateCompareActions(baselineItem?: GridItemData, comparisonItem?: GridItemData) {
    const { item } = this.state;

    this.setState({
      compareActionChecks: [baselineItem?.value === item.value, comparisonItem?.value === item.value],
    });
  }

  getStatsDescription() {
    const profileMetricId = getSceneVariableValue(this, 'profileMetricId');
    const { description } = getProfileMetric(profileMetricId as ProfileMetricId);
    return description || getProfileMetricLabel(profileMetricId);
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
    const { item, itemStats, statsDescription, compareActionChecks } = model.useState();

    return (
      <StatsPanel
        item={item}
        itemStats={itemStats}
        statsDescription={statsDescription}
        compareActionChecks={compareActionChecks}
        onChangeCompareTarget={model.onChangeCompareTarget}
      />
    );
  }
}
