import { FilterKind, Filters } from '../types';

export function areFiltersEqual(newFilters: Filters, previousFilters: Filters): boolean {
  const newFiltersWithoutPartial = newFilters.filter(({ type }) => type !== FilterKind.partial);
  const previousFiltersWithoutPartial = previousFilters.filter(({ type }) => type !== FilterKind.partial);

  return (
    newFiltersWithoutPartial.length === previousFiltersWithoutPartial.length &&
    newFiltersWithoutPartial.every((filter) =>
      previousFiltersWithoutPartial.find(
        ({ type, attribute, operator, value }) =>
          type === filter.type &&
          attribute.value === filter.attribute.value &&
          operator?.value === filter.operator?.value &&
          value?.value === filter.value?.value
      )
    )
  );
}
