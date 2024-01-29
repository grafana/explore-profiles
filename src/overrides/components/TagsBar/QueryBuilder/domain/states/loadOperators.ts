import { assign, State, StateNodeConfig } from 'xstate';

import { MESSAGES } from '../../ui/constants';
import { defaultContext } from '../stateMachine';
import { QueryBuilderContext, QueryBuilderEvent, SuggestionKind } from '../types';

export const loadOperators: StateNodeConfig<
  QueryBuilderContext,
  State<QueryBuilderContext, QueryBuilderEvent>,
  QueryBuilderEvent
> = {
  entry: assign({
    suggestions: () => ({
      ...defaultContext.suggestions,
      isVisible: true,
      isLoading: true,
    }),
  }),
  invoke: {
    id: 'fetchOperators',
    src: 'fetchOperators',
    onDone: {
      target: 'displayOperators',
      actions: assign({
        suggestions: (context, event) => ({
          ...context.suggestions,
          items: event.data,
          isLoading: false,
        }),
      }),
    },
    onError: {
      target: 'displayOperators',
      actions: assign({
        suggestions: (context, event) => ({
          ...context.suggestions,
          items: [],
          isLoading: false,
          error: event.data,
        }),
      }),
    },
  },
  on: {
    DISCARD_SUGGESTIONS: 'idle',
  },
};

export const displayOperators: StateNodeConfig<
  QueryBuilderContext,
  State<QueryBuilderContext, QueryBuilderEvent>,
  QueryBuilderEvent
> = {
  entry: assign({
    suggestions: (context) => ({
      ...context.suggestions,
      type: SuggestionKind.operator,
      isVisible: true,
      placeholder: MESSAGES.SELECT_OPERATOR,
      allowCustomValue: false,
      multiple: false,
    }),
  }),
  on: {
    DISCARD_SUGGESTIONS: 'idle',
    SELECT_SUGGESTION: [
      // edition
      {
        cond: 'shouldSuggestValuesAfterOperatorEdition',
        target: 'loadLabelValues',
        actions: ['editFilterOperator'],
      },
      {
        cond: 'shouldNotSuggestValuesAfterOperatorEdition',
        target: 'autoSuggestProxy',
        actions: ['editFilterOperator'],
      },
      // no edition
      {
        cond: 'hasPartialFilter',
        target: 'autoSuggestProxy',
        actions: ['setFilterOperator'],
      },
      {
        target: 'loadLabelValues',
        actions: ['setFilterOperator'],
      },
    ],
    REMOVE_LAST_FILTER: {
      target: 'loadLabels',
      actions: ['removeLastFilter'],
    },
  },
};
