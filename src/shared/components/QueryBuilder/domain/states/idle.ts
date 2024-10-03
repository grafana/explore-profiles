import { assign, State, StateNodeConfig } from 'xstate';

import { MESSAGES } from '../../ui/constants';
import { getLastFilter } from '../helpers/getLastFilter';
import { isMultipleValuesOperator } from '../helpers/isMultipleValuesOperator';
import { isPartialFilter } from '../helpers/isPartialFilter';
import { isRegexOperator } from '../helpers/isRegexOperator';
import { defaultContext } from '../stateMachine';
import { QueryBuilderContext, QueryBuilderEvent } from '../types';

export const idle: StateNodeConfig<
  QueryBuilderContext,
  State<QueryBuilderContext, QueryBuilderEvent>,
  QueryBuilderEvent
> = {
  entry: [
    'cancelAllLoad',
    assign({
      // eslint-disable-next-line sonarjs/cognitive-complexity
      suggestions: (context) => {
        let placeholder = MESSAGES.FILTER_ADD;
        let allowCustomValue = false;
        const lastFilter = getLastFilter(context.filters);

        if (lastFilter && isPartialFilter(lastFilter)) {
          if (!lastFilter.operator) {
            placeholder = MESSAGES.SELECT_OPERATOR;
          } else {
            allowCustomValue = isRegexOperator(lastFilter.operator.value);

            placeholder = isMultipleValuesOperator(lastFilter.operator.value)
              ? MESSAGES.SELECT_VALUES
              : allowCustomValue
              ? MESSAGES.TYPE_VALUE
              : MESSAGES.SELECT_VALUE;
          }
        }

        return {
          ...defaultContext.suggestions,
          placeholder,
          allowCustomValue,
        };
      },
      edition: null,
    }),
  ],
  on: {
    START_INPUT: [
      {
        cond: 'shouldSuggestAttributes',
        target: 'loadLabels',
      },
      {
        cond: 'shouldSuggestOperators',
        target: 'loadOperators',
      },
      {
        cond: 'shouldSuggestValues',
        target: 'loadLabelValues',
      },
    ],
    EDIT_FILTER: [
      {
        cond: 'shouldEditAttribute',
        target: 'loadLabels',
        actions: ['setEdition'],
      },
      {
        cond: 'shouldEditOperator',
        target: 'loadOperators',
        actions: ['setEdition'],
      },
      {
        cond: 'shouldEditValue',
        target: 'loadLabelValues',
        actions: ['setEdition'],
      },
    ],
    REMOVE_FILTER: [
      {
        cond: 'hasPartialFilter',
        target: 'autoSuggestProxy',
        actions: ['removeFilter'],
      },
      {
        target: 'idle',
        actions: ['removeFilter'],
      },
    ],
    REMOVE_LAST_FILTER: {
      target: 'idle',
      actions: ['removeLastFilter'],
    },
    CHANGE_INPUT_PARAMS: {
      target: 'idle',
      actions: ['changeInputParams'],
    },
    EXECUTE_QUERY: {
      target: 'idle',
      actions: ['activateFilters'],
    },
  },
};
