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
import { FilterButtons, FilterButtonsProps } from './ui/FilterButtons';

export interface IncludeExcludeActionState extends SceneObjectState {
  item: GridItemData;
}

export class IncludeExcludeAction extends SceneObjectBase<IncludeExcludeActionState> {
  constructor({ item }: IncludeExcludeActionState) {
    super({ item });
  }

  // eslint-disable-next-line sonarjs/cognitive-complexity
  getStatus(filters: AdHocVariableFilter[]) {
    let status: FilterButtonsProps['status'] = 'clear';
    let disabledStatus: FilterButtonsProps['disabledStatus'];

    const { key, value } = this.state.item.queryRunnerParams.filters![0];

    const found = filters.find((f) => f.key === key);
    if (!found) {
      return { status, disabledStatus };
    }

    if (isRegexOperator(found.operator) && found.value.split('|').includes(value)) {
      status = found.operator === '=~' ? 'included' : 'excluded';
    } else if (found.value === value) {
      status = found.operator === '=' ? 'included' : 'excluded';
    }

    return {
      status,
      disabledStatus: status === 'clear' ? this.getDisabledStatus(found, value) : undefined,
    };
  }

  getDisabledStatus(existingFilter: AdHocVariableFilter, labelValue: string): FilterButtonsProps['disabledStatus'] {
    switch (existingFilter.operator) {
      case '=~':
      case '=':
        return existingFilter.value !== labelValue ? 'disable-exclude' : undefined;

      case '!~':
      case '!=':
        return existingFilter.value !== labelValue ? 'disable-include' : undefined;

      default:
        return undefined;
    }
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
    const { status, disabledStatus } = useMemo(() => model.getStatus(filters), [filters, model]);

    return (
      <FilterButtons
        label={item.value}
        status={status}
        disabledStatus={disabledStatus}
        onInclude={model.onInclude}
        onExclude={model.onExclude}
        onClear={model.onClear}
      />
    );
  };
}
