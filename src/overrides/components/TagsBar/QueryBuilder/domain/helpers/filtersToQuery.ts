import { CompleteFilter, FilterKind, Filters, OperatorKind } from '../types';

export function filtersToQuery(query: string, filters: Filters) {
  const labelsList = filters
    .filter(({ type }) => type !== FilterKind.partial)
    .map((filter) => {
      const { attribute, operator, value } = filter as CompleteFilter;

      return operator.value === OperatorKind.in
        ? `${attribute.value}=~"${value.value}"`
        : `${attribute.value}${operator.value}"${value.value}"`;
    });

  const [, serviceNameLabel] = query.match(/{.*(service_name="[^"]*").*}/) ?? [];

  if (serviceNameLabel) {
    labelsList.unshift(serviceNameLabel);
  }

  return query.replace(/{(.*)}$/, `{${labelsList.join(',')}}`);
}
