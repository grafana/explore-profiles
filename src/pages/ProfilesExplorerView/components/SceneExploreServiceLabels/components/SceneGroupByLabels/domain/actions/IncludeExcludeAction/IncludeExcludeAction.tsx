import { AdHocVariableFilter } from '@grafana/data';
import { SceneComponentProps, sceneGraph, SceneObjectBase, SceneObjectState } from '@grafana/scenes';
import { isRegexOperator } from '@shared/components/QueryBuilder/domain/helpers/isRegexOperator';
import { reportInteraction } from '@shared/domain/reportInteraction';
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

export class IncludeExcludeAction extends SceneObjectBase<IncludeExcludeActionState> {
  constructor({ item }: IncludeExcludeActionState) {
    super({ item });
  }

  getStatus(filters: AdHocVariableFilter[]) {
    const { key, value } = this.state.item.queryRunnerParams.filters![0];

    const found = filters.find((f) => f.key === key);
    if (!found) {
      return 'clear';
    }

    if (isRegexOperator(found.operator) && found.value.split('|').includes(value)) {
      return found.operator === '=~' ? 'included' : 'excluded';
    }

    // found.operator is '=' or '!='
    if (found.value === value) {
      return found.operator === '=' ? 'included' : 'excluded';
    }

    return 'clear';
  }

  onInclude = () => {
    reportInteraction('g_pyroscope_app_include_action_clicked');

    this.publishEvent(new EventIncludeLabelInFilters({ item: this.state.item }), true);
  };

  onExclude = () => {
    reportInteraction('g_pyroscope_app_exclude_action_clicked');

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
