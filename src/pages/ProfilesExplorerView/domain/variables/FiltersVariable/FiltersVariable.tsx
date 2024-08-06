import { css } from '@emotion/css';
import { AdHocFiltersVariable, SceneComponentProps, sceneGraph } from '@grafana/scenes';
import { useStyles2 } from '@grafana/ui';
import { CompleteFilters } from '@shared/components/QueryBuilder/domain/types';
import { QueryBuilder } from '@shared/components/QueryBuilder/QueryBuilder';
import { useQueryFromUrl } from '@shared/domain/url-params/useQueryFromUrl';
import React, { useEffect, useMemo } from 'react';

import { findSceneObjectByClass } from '../../../helpers/findSceneObjectByClass';
import { ProfileMetricVariable } from '../ProfileMetricVariable';
import { ProfilesDataSourceVariable } from '../ProfilesDataSourceVariable';
import { ServiceNameVariable } from '../ServiceNameVariable';
import { convertPyroscopeToVariableFilter, expressionBuilder } from './filters-ops';

export class FiltersVariable extends AdHocFiltersVariable {
  static DEFAULT_VALUE = [];

  constructor() {
    super({
      name: 'filters',
      label: 'Filters',
      filters: FiltersVariable.DEFAULT_VALUE,
    });

    this.addActivationHandler(() => {
      // VariableDependencyConfig does not work :man_shrug: (never called)
      const dataSourceSub = (
        findSceneObjectByClass(this, ProfilesDataSourceVariable) as ProfilesDataSourceVariable
      ).subscribeToState(() => {
        this.setState({ filters: [] });
      });

      return () => {
        dataSourceSub.unsubscribe();
      };
    });
  }

  updateQuery = (query: string, filters: CompleteFilters) => {
    this.setState({
      filters: filters.map(convertPyroscopeToVariableFilter),
    });
  };

  static Component = ({ model }: SceneComponentProps<AdHocFiltersVariable & { updateQuery?: any }>) => {
    const styles = useStyles2(getStyles);
    const { filters } = model.useState();
    const [, setQuery] = useQueryFromUrl();

    const { value: dataSourceUid } = (
      findSceneObjectByClass(model, ProfilesDataSourceVariable) as ProfilesDataSourceVariable
    ).useState();

    const { value: serviceName } = (
      findSceneObjectByClass(model, ServiceNameVariable) as ServiceNameVariable
    ).useState();

    const { value: profileMetricId } = (
      findSceneObjectByClass(model, ProfileMetricVariable) as ProfileMetricVariable
    ).useState();

    const filterExpression = useMemo(
      () => expressionBuilder(serviceName as string, profileMetricId as string, filters),
      [filters, profileMetricId, serviceName]
    );

    const { from, to } = sceneGraph.getTimeRange(model).state.value;

    useEffect(() => {
      if (typeof filterExpression === 'string') {
        // Explain Flame Graph (AI button) depends on the query value so we have to sync it here
        setQuery(filterExpression);
      }
    }, [filterExpression, setQuery]);

    return (
      <QueryBuilder
        id="query-builder-explore"
        autoExecute
        className={styles.queryBuilder}
        dataSourceUid={dataSourceUid as string}
        query={filterExpression as string}
        from={from.unix() * 1000}
        to={to.unix() * 1000}
        onChangeQuery={model.updateQuery}
      />
    );
  };
}

const getStyles = () => ({
  queryBuilder: css`
    width: 100%;
  `,
});
