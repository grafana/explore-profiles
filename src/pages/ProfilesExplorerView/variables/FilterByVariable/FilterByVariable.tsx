import { css } from '@emotion/css';
import { AdHocVariableFilter } from '@grafana/data';
import { AdHocFiltersVariable, SceneComponentProps, sceneGraph } from '@grafana/scenes';
import { useStyles2 } from '@grafana/ui';
import { CompleteFilter, CompleteFilters } from '@shared/components/QueryBuilder/domain/types';
import { QueryBuilder } from '@shared/components/QueryBuilder/QueryBuilder';
import { isEqual } from 'lodash';
import React, { useCallback } from 'react';

import { ProfileMetricVariable } from '../ProfileMetricVariable';
import { convertPyroscopeToVariableFilter, updateBaseFilters, updateFilters } from './filters-ops';

type FilterByVariableState = ConstructorParameters<typeof AdHocFiltersVariable>[0] & {
  baseFilters: AdHocVariableFilter[];
  filters: AdHocVariableFilter[];
};

export class FilterByVariable extends AdHocFiltersVariable {
  constructor({ initialFilters }: { initialFilters?: FilterByVariableState['filters'] }) {
    super({
      name: 'filters',
      label: 'Filters',
      baseFilters: [],
      filters: initialFilters || [],
      filterExpression: '',
    });

    this.addActivationHandler(() => {
      updateBaseFilters(this);

      // const serviceNameSub = (sceneGraph.lookupVariable('serviceName', this) as ServiceNameVariable)?.subscribeToState(
      //   (newState) => {
      //     if (newState.value !== this.state.baseFilters?.[0]?.value) {
      //       updateBaseFilters(this);
      //       updateFilters(this, []); // reset
      //     }
      //   }
      // );

      const profileMetricIdSub = (
        sceneGraph.lookupVariable('profileMetricId', this) as ProfileMetricVariable
      )?.subscribeToState((newState) => {
        if (newState.value !== this.state.baseFilters?.[1].value) {
          updateBaseFilters(this);
        }
      });

      return () => {
        profileMetricIdSub?.unsubscribe();
        // serviceNameSub?.unsubscribe();
      };
    });
  }

  static Component = ({ model }: SceneComponentProps<FilterByVariable>) => {
    const styles = useStyles2(getStyles);
    const { filterExpression, filters } = model.useState();

    const onChangeQuery = useCallback(
      (query: string, filters: CompleteFilters) => {
        const newFilters = filters.map(convertPyroscopeToVariableFilter);

        updateFilters(model, newFilters);
      },
      [model]
    );

    const onRemoveChiclet = useCallback(
      (filter: CompleteFilter) => {
        const filterForCompare = convertPyroscopeToVariableFilter(filter);
        const newFilters = filters.filter((f) => !isEqual(f, filterForCompare));

        updateFilters(model, newFilters);
      },
      [filters, model]
    );

    const { from, to } = sceneGraph.getTimeRange(model).state.value;

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
