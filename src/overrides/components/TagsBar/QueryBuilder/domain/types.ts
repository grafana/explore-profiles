import { State } from 'xstate';

export enum FilterKind {
  'partial' = 'partial',
  'attribute-operator-value' = 'attribute-operator-value',
}

export enum OperatorKind {
  '=' = '=',
  '!=' = '!=',
  '=~' = '=~',
  '!~' = '!~',
  'in' = 'in',
}

export type PartialFilter = {
  id: string;
  type: FilterKind;
  attribute: Suggestion;
  operator?: Suggestion;
  value?: Suggestion;
};

export type CompleteFilter = {
  id: string;
  type: FilterKind;
  attribute: Suggestion;
  operator: Suggestion;
  value: Suggestion;
};

export type Filter = PartialFilter | CompleteFilter;

export type CompleteFilters = CompleteFilter[];

export type Filters = [PartialFilter] | CompleteFilter[] | [...CompleteFilter[], PartialFilter];

export enum FilterPartKind {
  attribute = 'attribute',
  operator = 'operator',
  value = 'value',
}

export type Suggestion = {
  value: string;
  label: string;
};

export type Suggestions = Suggestion[];

export enum SuggestionKind {
  'attribute' = 'attribute',
  'operator' = 'operator',
  'value' = 'value',
}

export type InputParams = {
  query: string;
  from: number;
  until: number;
};

export type Edition = {
  filterId: string;
  part: FilterPartKind;
};

export type QueryBuilderContext = {
  inputParams: InputParams;
  query: string;
  filters: Filters;
  edition: Edition | null;
  suggestions: {
    type: SuggestionKind | null;
    items: Suggestions;
    isVisible: boolean;
    isLoading: boolean;
    error: Error | null;
    placeholder: string;
    allowCustomValue: boolean;
    multiple: boolean;
  };
};

export type QueryBuilderSchema = {
  states: {
    idle: State<QueryBuilderContext, QueryBuilderEvent>;
    loadLabels: State<QueryBuilderContext, QueryBuilderEvent>;
    displayLabels: State<QueryBuilderContext, QueryBuilderEvent>;
    loadLabelValues: State<QueryBuilderContext, QueryBuilderEvent>;
    loadOperators: State<QueryBuilderContext, QueryBuilderEvent>;
    displayOperators: State<QueryBuilderContext, QueryBuilderEvent>;
    displayLabelValues: State<QueryBuilderContext, QueryBuilderEvent>;
  };
};

export type StartEvent = { type: 'START_INPUT' };
export type SelectEvent = { type: 'SELECT_SUGGESTION'; data: Suggestion };
export type DiscardEvent = { type: 'DISCARD_SUGGESTIONS' };
export type EditEvent = { type: 'EDIT_FILTER'; data: Edition };
export type RemoveFilterEvent = { type: 'REMOVE_FILTER'; data: string }; // data = filterId
export type RemoveLastFilterEvent = { type: 'REMOVE_LAST_FILTER' };
export type ChangeInputParamsEvent = { type: 'CHANGE_INPUT_PARAMS'; data: InputParams };

export type QueryBuilderEvent =
  | StartEvent
  | SelectEvent
  | DiscardEvent
  | EditEvent
  | RemoveFilterEvent
  | RemoveLastFilterEvent
  | ChangeInputParamsEvent;