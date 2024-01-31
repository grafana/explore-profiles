import { Filter, FilterKind } from '../types';
import { invariant } from './invariant';

export const isPartialFilter = (filter: Filter): boolean => {
  invariant(Boolean(filter), 'The filter is falsy!');

  return filter.type === FilterKind.partial;
};
