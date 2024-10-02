import { Filter, FilterKind, OperatorKind } from '../types';

const IsEmptyFilter = {
  type: FilterKind['attribute-operator'],
  operator: {
    value: OperatorKind['is-empty'],
    label: 'is empty',
  },
  value: {
    value: OperatorKind['is-empty'],
    label: '',
  },
};

export const buildIsEmptyFilter = (filter: Filter) => ({ ...filter, ...IsEmptyFilter });
