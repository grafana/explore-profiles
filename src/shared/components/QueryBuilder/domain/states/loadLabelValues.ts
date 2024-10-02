import { assign, State, StateNodeConfig } from 'xstate';

import { invariant } from '../../../../types/helpers/invariant';
import { MESSAGES } from '../../ui/constants';
import { getFilterUnderEdition } from '../helpers/getFilterUnderEdition';
import { getLastFilter } from '../helpers/getLastFilter';
import { isMultipleValuesOperator } from '../helpers/isMultipleValuesOperator';
import { isPrivateLabel } from '../helpers/isPrivateLabel';
import { isRegexOperator } from '../helpers/isRegexOperator';
import { defaultContext } from '../stateMachine';
import { QueryBuilderContext, QueryBuilderEvent, SuggestionKind } from '../types';

export const loadLabelValues: StateNodeConfig<
  QueryBuilderContext,
  State<QueryBuilderContext, QueryBuilderEvent>,
  QueryBuilderEvent
> = {
  entry: assign({
    suggestions: (context) => {
      const targetFilter = context.edition ? getFilterUnderEdition(context) : getLastFilter(context.filters);

      invariant(typeof targetFilter?.operator !== undefined, 'No operator for the target filter!');

      return {
        ...defaultContext.suggestions,
        disabled:
          // don't fetch for these operators, an input will appear in the UI instead of a select
          ['=~', '!~'].includes(targetFilter!.operator!.value) ||
          // See https://github.com/grafana/pyroscope-app-plugin/issues/335
          isPrivateLabel(targetFilter!.attribute!.value),
        isVisible: true,
        isLoading: true,
      };
    },
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
    // eslint-disable-next-line sonarjs/cognitive-complexity
    suggestions: (context) => {
      const targetFilter = context.edition ? getFilterUnderEdition(context) : getLastFilter(context.filters);

      invariant(typeof targetFilter?.operator !== undefined, 'No operator for the target filter!');

      const targetOperator = targetFilter!.operator!.value;

      const allowCustomValue =
        isRegexOperator(targetOperator) ||
        // See https://github.com/grafana/pyroscope-app-plugin/issues/335
        context.suggestions.disabled;

      const multiple = isMultipleValuesOperator(targetOperator);

      let placeholder: string;

      if (allowCustomValue) {
        placeholder = MESSAGES.TYPE_VALUE;
      } else {
        placeholder = multiple ? MESSAGES.SELECT_VALUES : MESSAGES.SELECT_VALUE;
      }

      let noOptionsMessage: string;

      if (context.suggestions.error) {
        noOptionsMessage = MESSAGES.ERROR_LOAD;
      } else {
        noOptionsMessage = context.suggestions.disabled ? MESSAGES.SUGGESTIONS_DISABLED : MESSAGES.SUGGESTIONS_NONE;
      }

      return {
        ...context.suggestions,
        type: SuggestionKind.value,
        isVisible: true,
        placeholder,
        noOptionsMessage,
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
