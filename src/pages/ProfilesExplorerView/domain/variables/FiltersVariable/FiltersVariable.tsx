import { css } from '@emotion/css';
import { AdHocFiltersVariable, SceneComponentProps, sceneGraph } from '@grafana/scenes';
import { useStyles2 } from '@grafana/ui';
import { CompleteFilters } from '@shared/components/QueryBuilder/domain/types';
import { QueryBuilder } from '@shared/components/QueryBuilder/QueryBuilder';
import { useQueryFromUrl } from '@shared/domain/url-params/useQueryFromUrl';
import React, { useEffect, useMemo } from 'react';

import { ProfileMetricVariable } from '../ProfileMetricVariable';
import { ProfilesDataSourceVariable } from '../ProfilesDataSourceVariable';
import { ServiceNameVariable } from '../ServiceNameVariable';
import { convertPyroscopeToVariableFilter } from './filters-ops';

export class FiltersVariable extends AdHocFiltersVariable {
  static DEFAULT_VALUE = [];

  constructor() {
    super({
      key: 'filters',
      name: 'filters',
      label: 'Filters',
      filters: FiltersVariable.DEFAULT_VALUE,
      expressionBuilder: (filters) =>
        filters.map(({ key, operator, value }) => `${key}${operator}"${value}"`).join(','),
    });

    this.addActivationHandler(this.onActivate.bind(this));
  }

  onActivate() {
    // VariableDependencyConfig does not work :man_shrug: (never called)
    const dataSourceSub = sceneGraph
      .findByKeyAndType(this, 'dataSource', ProfilesDataSourceVariable)
      .subscribeToState(() => {
        this.setState({ filters: [] });
      });

    return () => {
      dataSourceSub.unsubscribe();
    };
  }

  onChangeQuery = (query: string, filters: CompleteFilters) => {
    this.setState({
      filters: filters.map(convertPyroscopeToVariableFilter),
    });
  };

  static Component = ({ model }: SceneComponentProps<AdHocFiltersVariable & { onChangeQuery?: any }>) => {
    const styles = useStyles2(getStyles);
    const { filterExpression } = model.useState();
    const [, setQuery] = useQueryFromUrl();

    const { value: dataSourceUid } = sceneGraph
      .findByKeyAndType(model, 'dataSource', ProfilesDataSourceVariable)
      .useState();

    const { value: serviceName } = sceneGraph.findByKeyAndType(model, 'serviceName', ServiceNameVariable).useState();

    const { value: profileMetricId } = sceneGraph
      .findByKeyAndType(model, 'profileMetricId', ProfileMetricVariable)
      .useState();

    const query = useMemo(
      () => `${profileMetricId}{service_name="${serviceName}",${filterExpression}}`,
      [filterExpression, profileMetricId, serviceName]
    );

    useEffect(() => {
      if (typeof query === 'string') {
        // Explain Flame Graph (AI button) depends on the query value so we have to sync it here
        setQuery(query);
      }
    }, [query, setQuery]);

    const { from, to } = sceneGraph.getTimeRange(model).state.value;

    return (
      <QueryBuilder
        id="query-builder-explore"
        autoExecute
        className={styles.queryBuilder}
        dataSourceUid={dataSourceUid as string}
        query={query}
        from={from.unix() * 1000}
        to={to.unix() * 1000}
        onChangeQuery={model.onChangeQuery}
      />
    );
  };
}

const getStyles = () => ({
  queryBuilder: css`
    width: 100%;
  `,
});
