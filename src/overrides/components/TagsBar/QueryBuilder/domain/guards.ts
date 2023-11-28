import { getFilterUnderEdition } from './helpers/getFilterUnderEdition';
import { isPartialFilter } from './helpers/isPartialFilter';
import { isSwitchingOperatorMode } from './helpers/isSwitchingOpStrictness';
import { EditEvent, FilterPartKind, QueryBuilderContext, QueryBuilderEvent, SelectEvent } from './types';

type CondFn<TContext, TEvent> = (context: TContext, event: TEvent) => boolean;
type Guards<TContext, TEvent> = Record<string, CondFn<TContext, TEvent>>;

export const guards: Guards<QueryBuilderContext, QueryBuilderEvent> = {
  shouldSuggestAttributes: (context) => {
    const lastFilter = context.filters.at(-1);
    if (!lastFilter) {
      return true;
    }

    return !isPartialFilter(lastFilter);
  },
  shouldSuggestOperators: (context) => {
    const lastFilter = context.filters.at(-1);
    if (!lastFilter) {
      return false;
    }

    return isPartialFilter(lastFilter) && !lastFilter.operator;
  },
  shouldSuggestValues: (context) => {
    const lastFilter = context.filters.at(-1);
    if (!lastFilter) {
      return false;
    }

    return isPartialFilter(lastFilter) && !lastFilter.value;
  },
  shouldEditAttribute: (context, event) => (event as EditEvent).data.part === FilterPartKind.attribute,
  shouldEditOperator: (context, event) => (event as EditEvent).data.part === FilterPartKind.operator,
  shouldEditValue: (context, event) => (event as EditEvent).data.part === FilterPartKind.value,
  // see assignOperatorToFilter() in domain/actions.ts
  shouldLoadLabelValues: (context, event) => {
    if (!context.edition) {
      return true;
    }

    // editing

    const lastFilter = context.filters.at(-1);

    if (lastFilter && isPartialFilter(lastFilter)) {
      return true;
    }

    return isSwitchingOperatorMode(getFilterUnderEdition(context), (event as SelectEvent).data.value);
  },
};
