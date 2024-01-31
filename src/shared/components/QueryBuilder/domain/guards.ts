import { getFilterUnderEdition } from './helpers/getFilterUnderEdition';
import { getLastFilter } from './helpers/getLastFilter';
import { isPartialFilter } from './helpers/isPartialFilter';
import { isSwitchingOperatorMode } from './helpers/isSwitchingOperatorMode';
import { EditEvent, FilterPartKind, QueryBuilderContext, QueryBuilderEvent, SelectEvent } from './types';

type CondFn<TContext, TEvent> = (context: TContext, event: TEvent) => boolean;
type Guards<TContext, TEvent> = Record<string, CondFn<TContext, TEvent>>;

export const guards: Guards<QueryBuilderContext, QueryBuilderEvent> = {
  shouldSuggestAttributes: (context) => {
    const lastFilter = getLastFilter(context.filters);
    return !lastFilter || !isPartialFilter(lastFilter);
  },
  shouldSuggestOperators: (context) => {
    return !getLastFilter(context.filters)?.operator;
  },
  shouldSuggestValues: (context) => {
    const lastFilter = getLastFilter(context.filters);
    return Boolean(lastFilter?.operator && !lastFilter?.value);
  },
  // edition only
  isEditing: (context) => context.edition !== null,
  shouldSuggestValuesAfterOperatorEdition: (context, event) => {
    if (!context.edition) {
      return false;
    }

    return isSwitchingOperatorMode(getFilterUnderEdition(context), (event as SelectEvent).data.value);
  },
  shouldNotSuggestValuesAfterOperatorEdition: (context, event) => {
    if (!context.edition) {
      return false;
    }

    return !isSwitchingOperatorMode(getFilterUnderEdition(context), (event as SelectEvent).data.value);
  },
  // after completion
  hasPartialFilter: (context) => {
    const lastFilter = getLastFilter(context.filters);
    return Boolean(lastFilter && isPartialFilter(lastFilter));
  },
  shouldEditAttribute: (context, event) => (event as EditEvent).data.part === FilterPartKind.attribute,
  shouldEditOperator: (context, event) => (event as EditEvent).data.part === FilterPartKind.operator,
  shouldEditValue: (context, event) => (event as EditEvent).data.part === FilterPartKind.value,
};
