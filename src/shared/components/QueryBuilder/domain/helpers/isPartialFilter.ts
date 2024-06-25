import { invariant } from '../../../../types/helpers/invariant';
import { Filter, FilterKind } from '../types';

export const isPartialFilter = (filter: Filter): boolean => {
  invariant(Boolean(filter), 'The filter is falsy!');

  return filter.type === FilterKind.partial;
};
