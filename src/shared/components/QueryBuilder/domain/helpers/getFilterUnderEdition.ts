import { invariant } from '../../../../types/helpers/invariant';
import { Filter, QueryBuilderContext } from '../types';

export function getFilterUnderEdition(context: QueryBuilderContext): Filter {
  const { edition, filters } = context;

  invariant(edition !== null, '"edition" is null!');

  const filter = filters.find(({ id }) => id === edition.filterId);

  invariant(filter !== undefined, 'Cannot find the filter under edition!');

  return filter;
}
