import { State, StateNodeConfig, assign } from 'xstate';
import { QueryBuilderContext, QueryBuilderEvent, SuggestionKind } from '../types';
import { MESSAGES } from '../../ui/constants';
import { defaultContext } from '../stateMachine';

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
      {
        cond: 'shouldLoadLabelValues',
        target: 'loadLabelValues',
        actions: ['assignOperatorToFilter'],
      },
      {
        target: 'idle',
        actions: ['assignOperatorToFilter'],
      },
    ],
    REMOVE_LAST_FILTER: {
      target: 'loadLabels',
      actions: ['removeLastFilter'],
    },
  },
};
