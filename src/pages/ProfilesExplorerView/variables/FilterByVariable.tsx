import { css } from '@emotion/css';
import { AdHocVariableFilter } from '@grafana/data';
import { AdHocFiltersVariable, SceneComponentProps, sceneGraph } from '@grafana/scenes';
import { useStyles2 } from '@grafana/ui';
import { CompleteFilters } from '@shared/components/QueryBuilder/domain/types';
import { QueryBuilder } from '@shared/components/QueryBuilder/QueryBuilder';
import React, { useCallback, useMemo } from 'react';

type FilterByVariableState = ConstructorParameters<typeof AdHocFiltersVariable>[0] & {
  baseFilters: AdHocVariableFilter[];
  filters: AdHocVariableFilter[];
};

export class FilterByVariable extends AdHocFiltersVariable {
  constructor({ initialFilters }: { initialFilters?: FilterByVariableState['filters'] }) {
    // hack: the variable does not sync, if the "var-profileMetricId" search parameter is present in the URL, it is set to an empty value
    // const initialValue = value || new URLSearchParams(window.location.search).get('var-filters') || '';

    super({
      name: 'filters',
      label: 'Filters',
      baseFilters: [],
      filters: initialFilters || [],
    });

    this.addActivationHandler(() => {
      // we use baseFilters to be able to update the query required by QueryBuilder
      const buildBaseFilters = () => [
        {
          key: 'service_name',
          operator: '=',
          value: sceneGraph.lookupVariable('serviceName', this)?.getValue() as string,
        },
        {
          key: 'profile_metric_id',
          operator: '=',
          value: sceneGraph.lookupVariable('profileMetricId', this)?.getValue() as string,
        },
      ];

      this.setState({ baseFilters: buildBaseFilters() });

      const serviceNameSub = sceneGraph.lookupVariable('serviceName', this)?.subscribeToState(() => {
        this.setState({
          baseFilters: buildBaseFilters(),
          // filters: [],
        });
      });

      const profileMetricIdSub = sceneGraph.lookupVariable('profileMetricId', this)?.subscribeToState(() => {
        this.setState({
          baseFilters: buildBaseFilters(),
        });
      });

      return () => {
        profileMetricIdSub?.unsubscribe();
        serviceNameSub?.unsubscribe();
      };
    });
  }

  static Component = ({ model }: SceneComponentProps<FilterByVariable>) => {
    const styles = useStyles2(getStyles);
    const { baseFilters, filters } = model.useState();

    const query = useMemo(() => {
      if (!baseFilters || !filters) {
        return '';
      }

      const completeFilters = [baseFilters[0], ...filters];
      const selector = completeFilters.map(({ key, operator, value }) => `${key}${operator}"${value}"`).join(',');

      return `${baseFilters[1].value}{${selector}}`;
    }, [baseFilters, filters]);

    console.log('*** Component baseFilters', baseFilters);
    console.log('*** Component filters', filters);
    console.log('*** Component query', query);

    const onChangeQuery = useCallback(
      (query: string, filters: CompleteFilters) => {
        console.log('*** onChangeQuery', query);
        console.log('*** onChangeQuery', filters);
        model.setState({
          filters: filters.map((f) => ({ key: f.attribute.value, operator: f.operator.value, value: f.value.value })),
        });
      },
      [model]
    );

    const { from, to } = sceneGraph.getTimeRange(model).state.value;

    return (
      <QueryBuilder
        id="query-builder-explore"
        className={styles.queryBuilder}
        query={query}
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
