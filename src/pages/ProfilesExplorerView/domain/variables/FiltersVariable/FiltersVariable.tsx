import { css } from '@emotion/css';
import { AdHocFiltersVariable, SceneComponentProps, sceneGraph } from '@grafana/scenes';
import { useStyles2 } from '@grafana/ui';
import { CompleteFilters } from '@shared/components/QueryBuilder/domain/types';
import { QueryBuilder } from '@shared/components/QueryBuilder/QueryBuilder';
import React from 'react';

import { useBuildPyroscopeQuery } from '../../useBuildPyroscopeQuery';
import { ProfilesDataSourceVariable } from '../ProfilesDataSourceVariable';
import { convertPyroscopeToVariableFilter } from './filters-ops';

export class FiltersVariable extends AdHocFiltersVariable {
  static DEFAULT_VALUE = [];

  constructor({ key }: { key: string }) {
    super({
      key,
      name: key,
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

    const { key } = model.useState();

    const query = useBuildPyroscopeQuery(model, key as string);

    const { value: dataSourceUid } = sceneGraph
      .findByKeyAndType(model, 'dataSource', ProfilesDataSourceVariable)
      .useState();

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
