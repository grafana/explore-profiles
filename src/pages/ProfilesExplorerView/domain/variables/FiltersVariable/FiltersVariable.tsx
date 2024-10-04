import { css } from '@emotion/css';
import { reportInteraction } from '@grafana/runtime';
import { AdHocFiltersVariable, SceneComponentProps, sceneGraph } from '@grafana/scenes';
import { Icon, InlineLabel, useStyles2 } from '@grafana/ui';
import { CompleteFilters, OperatorKind } from '@shared/components/QueryBuilder/domain/types';
import { QueryBuilder } from '@shared/components/QueryBuilder/QueryBuilder';
import { uniq } from 'lodash';
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
      filters: FiltersVariable.DEFAULT_VALUE,
      expressionBuilder: (filters) =>
        filters
          .map(({ key, operator, value }) =>
            operator === OperatorKind['is-empty'] ? `${key}=""` : `${key}${operator}"${value}"`
          )
          .join(','),
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
    reportInteraction('g_pyroscope_filters_changed', {
      name: this.state.name,
      count: filters.length,
      operators: uniq(filters.map((f) => f.operator.label)),
    });

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
      <>
        <InlineLabel width="auto">
          <Icon name="filter" />
          &nbsp;Filters
        </InlineLabel>
        <QueryBuilder
          id={`query-builder-${key}`}
          autoExecute
          className={styles.queryBuilder}
          dataSourceUid={dataSourceUid as string}
          query={query}
          from={from.unix() * 1000}
          to={to.unix() * 1000}
          onChangeQuery={model.onChangeQuery}
        />
      </>
    );
  };
}

const getStyles = () => ({
  queryBuilder: css`
    width: 100%;
  `,
});
