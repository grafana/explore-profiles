import { AdHocFiltersVariable, SceneComponentProps, sceneGraph, SceneObject } from '@grafana/scenes';
import { CompleteFilters, OperatorKind } from '@shared/components/QueryBuilder/domain/types';
import { QueryBuilder } from '@shared/components/QueryBuilder/QueryBuilder';
import { reportInteraction } from '@shared/domain/reportInteraction';
import { uniq } from 'lodash';
import React from 'react';

import { useBuildPyroscopeQuery } from '../../useBuildPyroscopeQuery';
import { ProfilesDataSourceVariable } from '../ProfilesDataSourceVariable';
import { convertPyroscopeToVariableFilter, isFilterValid } from './filters-ops';

export class FiltersVariable extends AdHocFiltersVariable {
  static DEFAULT_VALUE = [];

  constructor({ key }: { key: string }) {
    super({
      key,
      name: key,
      label: 'Filters',
      filters: FiltersVariable.DEFAULT_VALUE,
      expressionBuilder: (filters) =>
        filters
          // after parsing the URL search parameters the filters might end up having an invalid operator, which in turn, will
          // generate an invalid query that will make the API requests fail - we prevent this to happen by sanitizing the filters here
          .filter(isFilterValid)
          .map(({ key, operator, value }) =>
            operator === OperatorKind['is-empty'] ? `${key}=""` : `${key}${operator}"${value}"`
          )
          .join(','),
    });

    this.addActivationHandler(this.onActivate.bind(this));
  }

  reset() {
    this.setState({ filters: FiltersVariable.DEFAULT_VALUE });
  }

  static resetAll(sceneObject: SceneObject) {
    ['filters', 'filtersBaseline', 'filtersComparison'].forEach((filterKey) => {
      sceneGraph.findByKeyAndType(sceneObject, filterKey, FiltersVariable).reset();
    });
  }

  onActivate() {
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
