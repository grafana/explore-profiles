import { State, StateNodeConfig, assign } from 'xstate';
import { isPartialFilter } from '../helpers/isPartialFilter';
import { defaultContext } from '../stateMachine';
import { OperatorKind, QueryBuilderContext, QueryBuilderEvent } from '../types';
import { MESSAGES } from '../../ui/constants';

export const idle: StateNodeConfig<
  QueryBuilderContext,
  State<QueryBuilderContext, QueryBuilderEvent>,
  QueryBuilderEvent
> = {
  entry: [
    'cancelAllLoad',
    assign({
      suggestions: (context) => {
        let placeholder = MESSAGES.FILTER_ADD;
        const lastFilter = context.filters.at(-1);

        if (lastFilter && isPartialFilter(lastFilter)) {
          if (!lastFilter.operator) {
            placeholder = MESSAGES.SELECT_OPERATOR;
          } else {
            placeholder =
              lastFilter?.operator.value === OperatorKind.in ? MESSAGES.SELECT_VALUES : MESSAGES.SELECT_VALUE;
          }
        }

        return {
          ...defaultContext.suggestions,
          placeholder,
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
    REMOVE_FILTER: {
      target: 'idle',
      actions: ['removeFilter'],
    },
    REMOVE_LAST_FILTER: {
      target: 'idle',
      actions: ['removeLastFilter'],
    },
    CHANGE_INPUT_PARAMS: {
      target: 'idle',
      actions: ['changeInputParams'],
    },
  },
};
