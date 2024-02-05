import { State, StateNodeConfig } from 'xstate';

import { QueryBuilderContext, QueryBuilderEvent } from '../types';

export const autoSuggestProxy: StateNodeConfig<
  QueryBuilderContext,
  State<QueryBuilderContext, QueryBuilderEvent>,
  QueryBuilderEvent
> = {
  // epsilon transition to automatically suggests missing partial filter parts
  always: [
    {
      cond: 'shouldSuggestOperators',
      target: 'loadOperators',
    },
    {
      cond: 'shouldSuggestValues',
      target: 'loadLabelValues',
    },
    { target: 'idle' },
  ],
};
