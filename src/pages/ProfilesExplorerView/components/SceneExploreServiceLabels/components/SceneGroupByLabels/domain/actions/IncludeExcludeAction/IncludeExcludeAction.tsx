import { SceneComponentProps, SceneObjectBase, SceneObjectState } from '@grafana/scenes';
import React from 'react';

import { EventExcludeLabelFromFilters } from '../../../../../../../domain/events/EventExcludeLabelFromFilters';
import { EventIncludeLabelInFilters } from '../../../../../../../domain/events/EventIncludeLabelInFilters';
import { GridItemData } from '../../../../../../SceneByVariableRepeaterGrid/types/GridItemData';
import { FilterButtons } from './ui/FilterButtons';

interface IncludeExcludeActionState extends SceneObjectState {
  item: GridItemData;
}

export class IncludeExcludeAction extends SceneObjectBase<IncludeExcludeActionState> {
  constructor({ item }: { item: IncludeExcludeActionState['item'] }) {
    super({ item });
  }

  onInclude = () => {
    this.publishEvent(new EventIncludeLabelInFilters({ item: this.state.item }), true);
  };

  onExclude = () => {
    this.publishEvent(new EventExcludeLabelFromFilters({ item: this.state.item }), true);
  };

  onClear = () => {};

  public static Component = ({ model }: SceneComponentProps<IncludeExcludeAction>) => {
    const { item } = model.useState();

    return (
      <FilterButtons
        label={item.value}
        isIncluded={false}
        isExcluded={false}
        onInclude={model.onInclude}
        onExclude={model.onExclude}
        onClear={model.onClear}
      />
    );
  };
}
