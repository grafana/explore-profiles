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
import { areFiltersEqual } from './helpers/areFiltersEqual';
import { toggleCompleteFilters } from './helpers/toggleCompleteFilters';

export const actions: any = {
  cancelAllLoad: () => {
    labelsRepository.cancel('Discarded by user');
  },
  setEdition: assign({ edition: (context, event: EditEvent) => event.data }),
  assignAttributeToFilter: assign((context: QueryBuilderContext, event: SelectEvent) => {
    if (!context.edition) {
      const newFilters = [
        ...context.filters,
        { id: nanoid(10), type: FilterKind.partial, active: false, attribute: event.data },
      ] as Filters;

      return {
        ...context,
        filters: newFilters,
        isQueryUpToDate: areFiltersEqual(newFilters, queryToFilters(context.inputParams.query)),
      };
    }

    /* *** edition *** */

    const { filterId } = context.edition;

    // note: we can only edit the attribute of partial filters, so no need to rebuild the query here
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
      isQueryUpToDate: areFiltersEqual(newFilters, queryToFilters(context.inputParams.query)),
      edition: null,
    };
  }),
  // eslint-disable-next-line sonarjs/cognitive-complexity
  assignOperatorToFilter: assign((context: QueryBuilderContext, event: SelectEvent) => {
    if (!context.edition) {
      const newFilters = context.filters.map((filter) =>
        isPartialFilter(filter)
          ? ({
              ...filter,
              operator: event.data,
            } as PartialFilter)
          : filter
      ) as Filters;

      return {
        ...context,
        filters: newFilters,
        isQueryUpToDate: areFiltersEqual(newFilters, queryToFilters(context.inputParams.query)),
      };
    }

    /* *** edition *** */

    const { filterId } = context.edition;

    let newFilters = context.filters.map((filter) =>
      filter.id === filterId
        ? {
            ...filter,
            active: false,
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

    if (areFiltersEqual(newFilters, queryToFilters(context.inputParams.query))) {
      return {
        ...context,
        filters: toggleCompleteFilters(newFilters, true),
        isQueryUpToDate: true,
        edition: newEdition,
      };
    }

    // filters are different
    return {
      ...context,
      filters: newFilters,
      query: filtersToQuery(context.query, newFilters),
      isQueryUpToDate: false,
      edition: newEdition,
    };
  }),
  assignValueToFilter: assign((context: QueryBuilderContext, event: SelectEvent) => {
    const matchFn = context.edition
      ? (filter: Filter) => filter.id === context!.edition!.filterId
      : (filter: Filter) => isPartialFilter(filter);

    let newFilters = context.filters.map((filter) =>
      matchFn(filter)
        ? {
            ...filter,
            type: FilterKind['attribute-operator-value'],
            active: false,
            value: event.data,
          }
        : filter
    ) as Filters;

    if (areFiltersEqual(newFilters, queryToFilters(context.inputParams.query))) {
      return {
        ...context,
        filters: toggleCompleteFilters(newFilters, true),
        query: filtersToQuery(context.query, newFilters),
        isQueryUpToDate: true,
        edition: null,
      };
    }

    // filters are different
    return {
      ...context,
      filters: newFilters,
      query: filtersToQuery(context.query, newFilters),
      isQueryUpToDate: false,
      edition: null,
    };
  }),
  removeFilter: assign((context: QueryBuilderContext, event: RemoveFilterEvent) => {
    const filterId = event.data;
    const newFilters = toggleCompleteFilters(context.filters.filter(({ id }) => id !== filterId) as Filters, false);

    return {
      ...context,
      filters: newFilters,
      query: filtersToQuery(context.query, newFilters),
      isQueryUpToDate: areFiltersEqual(newFilters, queryToFilters(context.inputParams.query)),
    };
  }),
  removeLastFilter: assign((context: QueryBuilderContext) => {
    const { filters, query } = context;

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
      filters: newFilters,
      query: filtersToQuery(query, filters),
      isQueryUpToDate: areFiltersEqual(newFilters, queryToFilters(context.inputParams.query)),
    };
  }),
  changeInputParams: assign({
    inputParams: (context: QueryBuilderContext, event: ChangeInputParamsEvent) => event.data,
    query: (context: QueryBuilderContext, event: ChangeInputParamsEvent) => event.data.query,
    // See also buildStateMachine() in domain/stateMachine.ts
    filters: (context: QueryBuilderContext, event: ChangeInputParamsEvent) => queryToFilters(event.data.query),
    isQueryUpToDate: true,
  }),
  activateFilters: assign((context: QueryBuilderContext) => {
    const newFilters = context.filters.map((filter) =>
      filter.type === FilterKind.partial ? filter : { ...filter, active: true }
    ) as Filters;

    return {
      ...context,
      filters: newFilters,
      query: filtersToQuery(context.query, newFilters),
      isQueryUpToDate: true,
    };
  }),
};
