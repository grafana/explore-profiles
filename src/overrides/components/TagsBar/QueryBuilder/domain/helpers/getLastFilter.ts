import { Filter, Filters } from '../types';

export const getLastFilter = (filters: Filters): Filter | null => filters.at(-1) || null;
