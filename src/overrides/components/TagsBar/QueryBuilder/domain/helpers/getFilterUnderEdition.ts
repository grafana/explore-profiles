import { Filter, QueryBuilderContext } from '../types';
import { invariant } from './invariant';

export function getFilterUnderEdition(context: QueryBuilderContext): Filter {
  const { edition, filters } = context;

  invariant(edition !== null, '"edition" is null!');

  const filter = filters.find(({ id }) => id === edition.filterId);

  invariant(filter !== undefined, 'Cannot find the filter under edition!');

  return filter;
}