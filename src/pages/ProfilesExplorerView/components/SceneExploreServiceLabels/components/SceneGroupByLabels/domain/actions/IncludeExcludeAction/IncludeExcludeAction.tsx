import { AdHocVariableFilter } from '@grafana/data';
import { SceneComponentProps, sceneGraph, SceneObjectBase, SceneObjectState } from '@grafana/scenes';
import React, { useMemo } from 'react';

import { FiltersVariable } from '../../../../../../../domain/variables/FiltersVariable/FiltersVariable';
import { GridItemData } from '../../../../../../SceneByVariableRepeaterGrid/types/GridItemData';
import { EventClearLabelFromFilters } from '../../events/EventClearLabelFromFilters';
import { EventExcludeLabelFromFilters } from '../../events/EventExcludeLabelFromFilters';
import { EventIncludeLabelInFilters } from '../../events/EventIncludeLabelInFilters';
import { FilterButtons } from './ui/FilterButtons';

export interface IncludeExcludeActionState extends SceneObjectState {
  item: GridItemData;
}

type Status = 'included' | 'excluded' | 'clear';

export class IncludeExcludeAction extends SceneObjectBase<IncludeExcludeActionState> {
  constructor({ item }: IncludeExcludeActionState) {
    super({ item });
  }

  getStatus(filters: AdHocVariableFilter[]) {
    let status: Status = 'clear';

    const { key, value } = this.state.item.queryRunnerParams.filters![0];

    filters
      .filter((f) => f.key === key && (f.operator === '=~' || f.operator === '!~'))
      .some((f) => {
        if (!f.value.split('|').includes(value)) {
          return false;
        }

        status = f.operator === '=~' ? 'included' : 'excluded';

        return true;
      });

    return status;
  }

  onInclude = () => {
    this.publishEvent(new EventIncludeLabelInFilters({ item: this.state.item }), true);
  };

  onExclude = () => {
    this.publishEvent(new EventExcludeLabelFromFilters({ item: this.state.item }), true);
  };

  onClear = () => {
    this.publishEvent(new EventClearLabelFromFilters({ item: this.state.item }), true);
  };

  public static Component = ({ model }: SceneComponentProps<IncludeExcludeAction>) => {
    const { item } = model.useState();
    const { filters } = (sceneGraph.findByKeyAndType(model, 'filters', FiltersVariable) as FiltersVariable).useState();

    const status = useMemo(() => model.getStatus(filters), [filters, model]);

    return (
      <FilterButtons
        label={item.value}
        status={status}
        onInclude={model.onInclude}
        onExclude={model.onExclude}
        onClear={model.onClear}
      />
    );
  };
}
