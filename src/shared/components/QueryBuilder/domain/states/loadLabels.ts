import { assign, State, StateNodeConfig } from 'xstate';

import { MESSAGES } from '../../ui/constants';
import { defaultContext } from '../stateMachine';
import { QueryBuilderContext, QueryBuilderEvent, SuggestionKind, Suggestions } from '../types';

export const loadLabels: StateNodeConfig<
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
    id: 'fetchLabels',
    src: 'fetchLabels',
    onDone: {
      target: 'displayLabels',
      actions: assign({
        suggestions: (context, event) => ({
          ...context.suggestions,
          items: (event.data as Suggestions).filter(
            ({ value }) => !context.filters.some((filter) => filter.attribute?.value === value)
          ),
          isLoading: false,
        }),
      }),
    },
    onError: {
      target: 'displayLabels',
      actions: assign({
        suggestions: (context, event) => ({
          ...context.suggestions,
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

export const displayLabels: StateNodeConfig<
  QueryBuilderContext,
  State<QueryBuilderContext, QueryBuilderEvent>,
  QueryBuilderEvent
> = {
  entry: assign({
    suggestions: (context) => ({
      ...context.suggestions,
      type: SuggestionKind.attribute,
      isVisible: true,
      placeholder: MESSAGES.SELECT_LABEL,
    }),
  }),
  on: {
    DISCARD_SUGGESTIONS: 'idle',
    SELECT_SUGGESTION: [
      {
        cond: 'isEditing',
        target: 'loadOperators',
        actions: ['editFilterAttribute'],
      },
      {
        target: 'loadOperators',
        actions: ['setFilterAttribute'],
      },
    ],
    REMOVE_LAST_FILTER: {
      target: 'idle',
      actions: ['removeLastFilter'],
    },
  },
};
