import { AdHocVariableFilter } from '@grafana/data';
import { t } from '@grafana/i18n';
import { AdHocFiltersVariable, SceneComponentProps, sceneGraph, SceneObject } from '@grafana/scenes';
import { CompleteFilters } from '@shared/components/QueryBuilder/domain/types';
import { QueryBuilder } from '@shared/components/QueryBuilder/QueryBuilder';
import { buildFilterExpressionParts } from '@shared/components/SavedSearches/utils';
import { reportInteraction } from '@shared/domain/reportInteraction';
import { uniq } from 'lodash';
import React from 'react';

import { useBuildPyroscopeQuery } from '../../useBuildPyroscopeQuery';
import { ProfilesDataSourceVariable } from '../ProfilesDataSourceVariable';
import {
  FILTER_EXPRESSION_WITH_LEADING_COMMA,
  filterExpressionWithLeadingComma,
} from './filterExpressionWithLeadingComma';
import { convertPyroscopeToVariableFilter } from './filters-ops';

const FILTERS_LABEL_DEFAULT = 'Filters';

export class FiltersVariable extends AdHocFiltersVariable {
  static DEFAULT_VALUE = [];
  private initialFilters?: AdHocVariableFilter[];

  constructor({ key, initialFilters }: { key: string; initialFilters?: AdHocVariableFilter[] }) {
    super({
      key,
      name: key,
      label: FILTERS_LABEL_DEFAULT,
      filters: FiltersVariable.DEFAULT_VALUE,
      expressionBuilder: (filters) => buildFilterExpressionParts(filters),
    });
    this.initialFilters = initialFilters;
    this.addActivationHandler(this.onActivate.bind(this));
  }

  reset() {
    this.setState({ filters: FiltersVariable.DEFAULT_VALUE });
  }

  getValue(fieldPath?: string) {
    if (fieldPath === FILTER_EXPRESSION_WITH_LEADING_COMMA) {
      return filterExpressionWithLeadingComma(this.state.filterExpression);
    }

    return super.getValue(fieldPath);
  }

  static resetAll(sceneObject: SceneObject) {
    ['filters', 'filtersBaseline', 'filtersComparison'].forEach((filterKey) => {
      sceneGraph.findByKeyAndType(sceneObject, filterKey, FiltersVariable).reset();
    });
  }

  onActivate() {
    this.setState({ label: t('variables.filters.label', FILTERS_LABEL_DEFAULT) });
    this.setInitialValue();

    // VariableDependencyConfig does not work :man_shrug: (never called)
    const dataSourceSub = sceneGraph
      .findByKeyAndType(this, 'dataSource', ProfilesDataSourceVariable)
      .subscribeToState(() => {
        this.reset();
      });

    return () => {
      dataSourceSub.unsubscribe();
    };
  }

  setInitialValue() {
    if (this.initialFilters && this.initialFilters.length > 0) {
      this.setState({ filters: this.initialFilters });
    }
  }

  onChangeQuery = (query: string, filters: CompleteFilters) => {
    reportInteraction('g_pyroscope_app_filters_changed', {
      name: this.state.name,
      count: filters.length,
      operators: uniq(filters.map((f) => f.operator.label)),
    });

    this.setState({
      filters: filters.map(convertPyroscopeToVariableFilter),
    });
  };

  static Component = ({ model }: SceneComponentProps<AdHocFiltersVariable & { onChangeQuery?: any }>) => {
    const { key } = model.useState();

    const query = useBuildPyroscopeQuery(model, key as string);

    const { value: dataSourceUid } = sceneGraph
      .findByKeyAndType(model, 'dataSource', ProfilesDataSourceVariable)
      .useState();

    const { from, to } = sceneGraph.getTimeRange(model).state.value;

    return (
      <QueryBuilder
        id={`query-builder-${key}`}
        autoExecute
        dataSourceUid={dataSourceUid as string}
        query={query}
        from={from.unix() * 1000}
        to={to.unix() * 1000}
        onChangeQuery={model.onChangeQuery}
      />
    );
  };
}
