import { State, StateNodeConfig, assign } from 'xstate';
import { OperatorKind, QueryBuilderContext, QueryBuilderEvent, SuggestionKind } from '../types';
import { getFilterUnderEdition } from '../helpers/getFilterUnderEdition';
import { MESSAGES } from '../../ui/constants';
import { defaultContext } from '../stateMachine';
import { invariant } from '../helpers/invariant';
import { getLastFilter } from '../helpers/getLastFilter';

export const loadLabelValues: StateNodeConfig<
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
    id: 'fetchLabelValues',
    src: 'fetchLabelValues',
    onDone: {
      target: 'displayLabelValues',
      actions: assign({
        suggestions: (context, event) => ({
          ...context.suggestions,
          items: event.data,
          isLoading: false,
        }),
      }),
    },
    onError: {
      target: 'displayLabelValues',
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

export const displayLabelValues: StateNodeConfig<
  QueryBuilderContext,
  State<QueryBuilderContext, QueryBuilderEvent>,
  QueryBuilderEvent
> = {
  entry: assign({
    suggestions: (context) => {
      const targetFilter = context.edition ? getFilterUnderEdition(context) : getLastFilter(context.filters);

      invariant(typeof targetFilter?.operator !== undefined, 'No operator for the target filter!');

      const targetOperator = targetFilter!.operator!.value;

      const allowCustomValue = ['=~', '!~'].includes(targetOperator);
      const multiple = targetOperator === OperatorKind.in;

      let placeholder: string;

      if (allowCustomValue) {
        placeholder = MESSAGES.TYPE_VALUE;
      } else {
        placeholder = multiple ? MESSAGES.SELECT_VALUES : MESSAGES.SELECT_VALUE;
      }

      return {
        ...context.suggestions,
        type: SuggestionKind.value,
        isVisible: true,
        placeholder,
        allowCustomValue,
        multiple,
      };
    },
  }),
  on: {
    DISCARD_SUGGESTIONS: 'idle',
    SELECT_SUGGESTION: [
      {
        cond: 'isEditing',
        target: 'autoSuggestProxy',
        actions: ['editFilterValue'],
      },
      {
        target: 'idle',
        actions: ['setFilterValue'],
      },
    ],
    REMOVE_LAST_FILTER: {
      target: 'loadOperators',
      actions: ['removeLastFilter'],
    },
  },
};
