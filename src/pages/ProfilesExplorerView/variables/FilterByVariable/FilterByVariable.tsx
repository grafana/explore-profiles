import { css } from '@emotion/css';
import { AdHocVariableFilter } from '@grafana/data';
import { AdHocFiltersVariable, SceneComponentProps, sceneGraph } from '@grafana/scenes';
import { useStyles2 } from '@grafana/ui';
import { CompleteFilter, CompleteFilters } from '@shared/components/QueryBuilder/domain/types';
import { QueryBuilder } from '@shared/components/QueryBuilder/QueryBuilder';
import { isEqual } from 'lodash';
import React, { useCallback, useMemo } from 'react';

import { findSceneObjectByClass } from '../../helpers/findSceneObjectByClass';
import { ProfileMetricVariable } from '../ProfileMetricVariable';
import { ServiceNameVariable } from '../ServiceNameVariable';
import { convertPyroscopeToVariableFilter, expressionBuilder } from './filters-ops';

type FilterByVariableState = ConstructorParameters<typeof AdHocFiltersVariable>[0] & {
  baseFilters: AdHocVariableFilter[];
  filters: AdHocVariableFilter[];
};

export class FilterByVariable extends AdHocFiltersVariable {
  constructor({ initialFilters }: { initialFilters?: FilterByVariableState['filters'] }) {
    super({
      name: 'filters',
      label: 'Filters',
      filters: initialFilters || [],
    });
  }

  static Component = ({ model }: SceneComponentProps<FilterByVariable>) => {
    const styles = useStyles2(getStyles);
    const { filters } = model.useState();

    const { value: serviceName } = (
      findSceneObjectByClass(model, ServiceNameVariable) as ServiceNameVariable
    ).useState();

    const { value: profileMetricId } = (
      findSceneObjectByClass(model, ProfileMetricVariable) as ProfileMetricVariable
    ).useState();

    // TODO: fix these errors when trying to reset the filters whenever the servcie name changes
    // SceneVariableSet.js:161 SceneVariableSet updateAndValidate error Discarded by user
    // runRequest.catchError Discarded by user
    // Data source errors

    const filterExpression = useMemo(
      () => expressionBuilder(serviceName as string, profileMetricId as string, filters),
      [filters, profileMetricId, serviceName]
    );

    const { from, to } = sceneGraph.getTimeRange(model).state.value;

    const onChangeQuery = useCallback(
      (query: string, filters: CompleteFilters) => {
        model.setState({ filters: filters.map(convertPyroscopeToVariableFilter) });
      },
      [model]
    );

    const onRemoveChiclet = useCallback(
      (filter: CompleteFilter) => {
        const filterForCompare = convertPyroscopeToVariableFilter(filter);
        model.setState({ filters: filters.filter((f) => !isEqual(f, filterForCompare)) });
      },
      [filters, model]
    );

    return (
      <QueryBuilder
        id="query-builder-explore"
        className={styles.queryBuilder}
        query={filterExpression as string}
        from={from.unix() * 1000}
        until={to.unix() * 1000}
        onChangeQuery={onChangeQuery}
        onRemoveChiclet={onRemoveChiclet}
      />
    );
  };
}

const getStyles = () => ({
  queryBuilder: css`
    width: 100%;
  `,
});
