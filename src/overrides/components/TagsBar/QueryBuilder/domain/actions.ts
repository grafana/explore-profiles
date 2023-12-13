import { assign } from 'xstate';
import { nanoid } from 'nanoid';
import { labelsRepository } from '../infrastructure/labelsRepository';
import { filtersToQuery } from './helpers/filtersToQuery';
import { isPartialFilter } from './helpers/isPartialFilter';
import { queryToFilters } from './helpers/queryToFilters';
import {
  ChangeInputParamsEvent,
  EditEvent,
  FilterKind,
  FilterPartKind,
  Filters,
  OperatorKind,
  PartialFilter,
  QueryBuilderContext,
  RemoveFilterEvent,
  SelectEvent,
} from './types';
import { getLastFilter } from './helpers/getLastFilter';
import { areFiltersEqual } from './helpers/areFiltersEqual';
import { toggleCompleteFilters } from './helpers/toggleCompleteFilters';
import { isEditingOperatorMode } from './helpers/isSwitchingOperatorMode';

function updateFiltersAndQuery(newFilters: Filters, context: QueryBuilderContext) {
  const isQueryUpToDate = areFiltersEqual(newFilters, queryToFilters(context.inputParams.query));

  if (isQueryUpToDate) {
    return {
      filters: toggleCompleteFilters(newFilters, true),
      query: filtersToQuery(context.query, newFilters),
      isQueryUpToDate,
    };
  }

  return {
    filters: newFilters,
    query: filtersToQuery(context.query, newFilters),
    isQueryUpToDate,
  };
}

export const actions: any = {
  cancelAllLoad: () => {
    labelsRepository.cancel('Discarded by user');
  },
  // FILTER ATTRIBUTES
  setFilterAttribute: assign((context: QueryBuilderContext, event: SelectEvent) => {
    const newFilters = [
      ...context.filters,
      { id: nanoid(10), type: FilterKind.partial, active: false, attribute: event.data },
    ] as Filters;

    return {
      ...context,
      filters: newFilters,
      isQueryUpToDate: areFiltersEqual(newFilters, queryToFilters(context.inputParams.query)),
    };
  }),
  editFilterAttribute: assign((context: QueryBuilderContext, event: SelectEvent) => {
    if (context.edition === null) {
      throw new Error('Cannot edit filter attribute without edition data!');
    }

    const { filterId } = context.edition;

    const newFilters = context.filters.map((filter) =>
      filter.id === filterId
        ? {
            ...filter,
            attribute: event.data,
            operator: undefined,
            value: undefined,
          }
        : filter
    ) as Filters;

    return {
      ...context,
      filters: newFilters,
      // note: we can only edit the attribute of partial filters, so no need to rebuild the query here
      isQueryUpToDate: areFiltersEqual(newFilters, queryToFilters(context.inputParams.query)),
      edition: null,
    };
  }),
  // FILTER OPERATORS
  setFilterOperator: assign((context: QueryBuilderContext, event: SelectEvent) => {
    const newOperator = event.data;
    const newValue = newOperator.value === OperatorKind['is-empty'] ? { value: '', label: '' } : undefined;

    const newFilters = context.filters.map((filter) => {
      if (isPartialFilter(filter)) {
        const newType = newOperator.value === OperatorKind['is-empty'] ? FilterKind['attribute-operator'] : filter.type;

        return {
          ...filter,
          type: newType,
          operator: newOperator,
          value: newValue,
        } as PartialFilter;
      }

      return filter;
    }) as Filters;

    return {
      ...context,
      ...updateFiltersAndQuery(newFilters, context),
    };
  }),
  // eslint-disable-next-line sonarjs/cognitive-complexity
  editFilterOperator: assign((context: QueryBuilderContext, event: SelectEvent) => {
    if (context.edition === null) {
      throw new Error('Cannot edit filter attribute without edition data!');
    }

    const { filterId } = context.edition;
    const newOperator = event.data;
    let newEdition = null;

    const newFilters = context.filters.map((filter) => {
      if (filter.id !== filterId) {
        return filter;
      }

      const previousOperator = filter.operator!.value;

      if (newOperator.value === OperatorKind['is-empty']) {
        return {
          ...filter,
          type: FilterKind['attribute-operator'],
          operator: newOperator,
          value: { value: '', label: '' },
          active: false,
        };
      }

      if (!isPartialFilter(filter) && isEditingOperatorMode(previousOperator, newOperator.value)) {
        newEdition = { ...context.edition, part: FilterPartKind.value };
      }

      return {
        ...filter,
        type: FilterKind['attribute-operator-value'],
        operator: newOperator,
        value:
          previousOperator === OperatorKind.in && filter.value
            ? {
                value: filter.value.value.split('|').pop(),
                label: filter.value.label.split(', ').pop(),
              }
            : filter.value,
        active: false,
      };
    }) as Filters;

    return {
      ...context,
      ...updateFiltersAndQuery(newFilters, context),
      edition: newEdition,
    };
  }),
  // FILTER VALUES
  setFilterValue: assign((context: QueryBuilderContext, event: SelectEvent) => {
    const newFilters = context.filters.map((filter) =>
      isPartialFilter(filter)
        ? {
            ...filter,
            type: FilterKind['attribute-operator-value'],
            active: false,
            value: event.data,
          }
        : filter
    ) as Filters;

    return {
      ...context,
      ...updateFiltersAndQuery(newFilters, context),
    };
  }),
  editFilterValue: assign((context: QueryBuilderContext, event: SelectEvent) => {
    if (context.edition === null) {
      throw new Error('Cannot edit filter attribute without edition data!');
    }

    const { filterId } = context.edition;

    const newFilters = context.filters.map((filter) =>
      filter.id === filterId
        ? {
            ...filter,
            type: FilterKind['attribute-operator-value'],
            active: false,
            value: event.data,
          }
        : filter
    ) as Filters;

    return {
      ...context,
      ...updateFiltersAndQuery(newFilters, context),
      edition: null,
    };
  }),
  // FILTER REMOVAL
  removeFilter: assign((context: QueryBuilderContext, event: RemoveFilterEvent) => {
    const filterId = event.data;
    const newFilters = toggleCompleteFilters(context.filters.filter(({ id }) => id !== filterId) as Filters, false);

    return {
      ...context,
      ...updateFiltersAndQuery(newFilters, context),
    };
  }),
  removeLastFilter: assign((context: QueryBuilderContext) => {
    const { filters } = context;

    const lastFilter = getLastFilter(filters);
    if (!lastFilter) {
      return context;
    }

    if (isPartialFilter(lastFilter) && lastFilter.operator) {
      const newFilters = filters.slice(0, filters.length - 1).concat({ ...lastFilter, operator: undefined }) as Filters;

      return {
        ...context,
        filters: newFilters,
        // query doesn't have to change
        isQueryUpToDate: true,
      };
    }

    const newFilters = filters.slice(0, filters.length - 1).map((filter) => ({ ...filter, active: false })) as Filters;

    return {
      ...context,
      ...updateFiltersAndQuery(newFilters, context),
    };
  }),
  // MISC
  setEdition: assign({ edition: (context, event: EditEvent) => event.data }),
  changeInputParams: assign({
    inputParams: (context: QueryBuilderContext, event: ChangeInputParamsEvent) => event.data,
    query: (context: QueryBuilderContext, event: ChangeInputParamsEvent) => event.data.query,
    // See also buildStateMachine() in domain/stateMachine.ts
    filters: (context: QueryBuilderContext, event: ChangeInputParamsEvent) => queryToFilters(event.data.query),
    isQueryUpToDate: true,
  }),
  activateFilters: assign((context: QueryBuilderContext) => ({
    ...context,
    ...updateFiltersAndQuery(context.filters, context),
  })),
};
