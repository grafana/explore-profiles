import { Interpreter, createMachine, interpret, type MachineConfig, type MachineOptions } from 'xstate';
import { actions } from './actions';
import { guards } from './guards';
import { services } from './services';
import { idle } from './states/idle';
import { autoSuggestProxy } from './states/autoSuggestProxy';
import { displayLabelValues, loadLabelValues } from './states/loadLabelValues';
import { displayLabels, loadLabels } from './states/loadLabels';
import { displayOperators, loadOperators } from './states/loadOperators';
import { InputParams, QueryBuilderContext, QueryBuilderEvent, QueryBuilderSchema } from './types';
import { queryToFilters } from './helpers/queryToFilters';

export const defaultContext: QueryBuilderContext = Object.freeze({
  inputParams: {
    query: '',
    from: 0,
    until: 0,
  },
  query: '',
  filters: [],
  isQueryUpToDate: true,
  edition: null,
  suggestions: {
    type: null,
    items: [],
    isVisible: false,
    isLoading: false,
    error: null,
    placeholder: '',
    allowCustomValue: false,
    multiple: false,
  },
});

const config = (
  context: QueryBuilderContext
): MachineConfig<QueryBuilderContext, QueryBuilderSchema, QueryBuilderEvent> => ({
  id: 'query-builder',
  initial: 'idle',
  context,
  predictableActionArguments: true,
  states: {
    idle,
    loadLabels,
    displayLabels,
    loadOperators,
    displayOperators,
    loadLabelValues,
    displayLabelValues,
    autoSuggestProxy,
  },
});

const options: MachineOptions<QueryBuilderContext, QueryBuilderEvent> = {
  guards,
  services,
  actions,
};

export type Actor = Interpreter<QueryBuilderContext, QueryBuilderSchema, QueryBuilderEvent>;

export function buildStateMachine(inputParams: InputParams) {
  const { query } = inputParams;

  const initialContext: QueryBuilderContext = {
    ...defaultContext,
    inputParams,
    query,
    // See changeInputParams() in src/overrides/components/TagsBar/QueryBuilder/domain/actions.ts
    filters: queryToFilters(query),
  };

  const stateMachine = createMachine(config(initialContext), options);

  const actor = interpret(stateMachine) as unknown as Actor;

  return { actor, initialContext };
}
