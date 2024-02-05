import { FilterKind, Filters } from '../types';

export const toggleCompleteFilters = (filters: Filters, active: boolean): Filters =>
  filters.map((filter) => (filter.type !== FilterKind.partial ? { ...filter, active } : filter)) as Filters;
