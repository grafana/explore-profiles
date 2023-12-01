import { assign } from 'xstate';
import { nanoid } from 'nanoid';
import { labelsRepository } from '../infrastructure/labelsRepository';
import { filtersToQuery } from './helpers/filtersToQuery';
import { isPartialFilter } from './helpers/isPartialFilter';
import { queryToFilters } from './helpers/queryToFilters';
import {
  ChangeInputParamsEvent,
  EditEvent,
  Filter,
  FilterKind,
  FilterPartKind,
  Filters,
  OperatorKind,
  PartialFilter,
  QueryBuilderContext,
  RemoveFilterEvent,
  SelectEvent,
} from './types';
import { isSwitchingOperatorMode } from './helpers/isSwitchingOpStrictness';
import { getFilterUnderEdition } from './helpers/getFilterUnderEdition';
import { getLastFilter } from './helpers/getLastFilter';

export const actions: any = {
  cancelAllLoad: () => {
    labelsRepository.cancel('Discarded by user');
  },
  setEdition: assign({ edition: (context, event: EditEvent) => event.data }),
  assignAttributeToFilter: assign((context: QueryBuilderContext, event: SelectEvent) => {
    if (!context.edition) {
      return {
        ...context,
        filters: [...context.filters, { id: nanoid(10), type: FilterKind.partial, attribute: event.data }] as Filters,
      };
    }

    const { filterId } = context.edition;

    return {
      ...context,
      // we can't edit an attribute of a complete filter, so no need to rebuild the query
      filters: context.filters.map((filter) =>
        filter.id === filterId
          ? {
              ...filter,
              attribute: event.data,
              operator: undefined,
              value: undefined,
            }
          : filter
      ) as Filters,
      edition: null,
    };
  }),
  // eslint-disable-next-line sonarjs/cognitive-complexity
  assignOperatorToFilter: assign((context: QueryBuilderContext, event: SelectEvent) => {
    if (!context.edition) {
      const filters = context.filters.map((filter) =>
        isPartialFilter(filter)
          ? ({
              ...filter,
              operator: event.data,
            } as PartialFilter)
          : filter
      ) as Filters;

      return {
        ...context,
        query: filtersToQuery(context.query, filters),
        filters,
      };
    }

    const { filterId } = context.edition;

    const filters = context.filters.map((filter) =>
      filter.id === filterId
        ? {
            ...filter,
            operator: event.data,
            value:
              filter?.operator?.value === OperatorKind.in && filter.value
                ? {
                    value: filter.value.value.split('|').pop(),
                    label: filter.value.label.split(', ').pop(),
                  }
                : filter.value,
          }
        : filter
    ) as Filters;

    const filterUnderEdition = getFilterUnderEdition(context);

    const newEdition =
      !isPartialFilter(filterUnderEdition) && isSwitchingOperatorMode(filterUnderEdition, event.data.value)
        ? { ...context.edition, part: FilterPartKind.value }
        : null;

    return {
      ...context,
      query: filtersToQuery(context.query, filters),
      filters,
      edition: newEdition,
    };
  }),
  assignValueToFilter: assign((context: QueryBuilderContext, event: SelectEvent) => {
    const matchFn = context.edition
      ? (filter: Filter) => filter.id === context!.edition!.filterId
      : (filter: Filter) => isPartialFilter(filter);

    const filters = context.filters.map((filter) =>
      matchFn(filter)
        ? {
            ...filter,
            type: FilterKind['attribute-operator-value'],
            value: event.data,
          }
        : filter
    ) as Filters;

    return {
      ...context,
      query: filtersToQuery(context.query, filters),
      filters,
      edition: null,
    };
  }),
  removeFilter: assign((context: QueryBuilderContext, event: RemoveFilterEvent) => {
    const filterId = event.data;
    const filters = context.filters.filter(({ id }) => id !== filterId) as Filters;
    const query = filtersToQuery(context.query, filters);

    return { ...context, query, filters };
  }),
  removeLastFilter: assign((context: QueryBuilderContext) => {
    const { filters, query } = context;

    const lastFilter = getLastFilter(filters);
    if (!lastFilter) {
      return context;
    }

    if (isPartialFilter(lastFilter) && lastFilter.operator) {
      return {
        ...context,
        filters: filters.slice(0, filters.length - 1).concat({ ...lastFilter, operator: undefined }) as Filters,
        // query doesn't have to change
      };
    }

    filters.pop();

    return {
      ...context,
      query: filtersToQuery(query, filters),
      filters,
    };
  }),
  changeInputParams: assign({
    query: (context: QueryBuilderContext, event: ChangeInputParamsEvent) => event.data.query,
    inputParams: (context: QueryBuilderContext, event: ChangeInputParamsEvent) => event.data,
    // See buildStateMachine() in domain/stateMachine.ts
    filters: (context: QueryBuilderContext, event: ChangeInputParamsEvent) => queryToFilters(event.data.query),
  }),
};
