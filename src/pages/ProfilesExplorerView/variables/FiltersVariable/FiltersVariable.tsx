import { css } from '@emotion/css';
import { AdHocVariableFilter } from '@grafana/data';
import { AdHocFiltersVariable, SceneComponentProps, sceneGraph } from '@grafana/scenes';
import { useStyles2 } from '@grafana/ui';
import { CompleteFilters } from '@shared/components/QueryBuilder/domain/types';
import { QueryBuilder } from '@shared/components/QueryBuilder/QueryBuilder';
import { useQueryFromUrl } from '@shared/domain/url-params/useQueryFromUrl';
import React, { useCallback, useEffect, useMemo } from 'react';

import { findSceneObjectByClass } from '../../helpers/findSceneObjectByClass';
import { ProfileMetricVariable } from '../ProfileMetricVariable';
import { ServiceNameVariable } from '../ServiceNameVariable';
import { convertPyroscopeToVariableFilter, expressionBuilder } from './filters-ops';

type FilterByVariableState = ConstructorParameters<typeof AdHocFiltersVariable>[0] & {
  baseFilters: AdHocVariableFilter[];
  filters: AdHocVariableFilter[];
};

export class FiltersVariable extends AdHocFiltersVariable {
  static DEFAULT_VALUE = [];

  constructor({ initialFilters }: { initialFilters?: FilterByVariableState['filters'] }) {
    let initialValue = initialFilters;

    // hack: the variable does not sync, if the "var-filters" search parameter is present in the URL, it is set to an empty value
    if (!initialValue) {
      const urlValues = new URLSearchParams(window.location.search).getAll('var-filters');

      initialValue = urlValues
        .map((value) => value.match(/([^|]+)\|([^|]+)\|(.*)/))
        .filter(Boolean)
        .map((part) => {
          const [, key, operator, value] = part as string[];
          return {
            key,
            operator,
            value,
          };
        });
    }

    if (!initialValue.length) {
      initialValue = FiltersVariable.DEFAULT_VALUE;
    }

    super({
      name: 'filters',
      label: 'Filters',
      filters: initialValue,
    });
  }

  static Component = ({ model }: SceneComponentProps<FiltersVariable>) => {
    const styles = useStyles2(getStyles);
    const { filters } = model.useState();
    const [, setQuery] = useQueryFromUrl();

    const { value: serviceName } = (
      findSceneObjectByClass(model, ServiceNameVariable) as ServiceNameVariable
    ).useState();

    const { value: profileMetricId } = (
      findSceneObjectByClass(model, ProfileMetricVariable) as ProfileMetricVariable
    ).useState();

    // TODO: fix these errors when trying to reset the filters whenever the service name changes
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

    useEffect(() => {
      if (typeof filterExpression === 'string') {
        // Explain Flame Graph (AI button) depends on the query value so we have to sync it here
        setQuery(filterExpression);
      }
    }, [filterExpression, setQuery]);

    return (
      <QueryBuilder
        id="query-builder-explore"
        className={styles.queryBuilder}
        query={filterExpression as string}
        from={from.unix() * 1000}
        until={to.unix() * 1000}
        onChangeQuery={onChangeQuery}
      />
    );
  };
}

const getStyles = () => ({
  queryBuilder: css`
    width: 100%;
  `,
});
