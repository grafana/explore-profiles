import { CompleteFilter, FilterKind, Filters, OperatorKind } from '../types';

export function filtersToQuery(query: string, filters: Filters) {
  const labelsList = filters
    .filter(({ type }) => type !== FilterKind.partial)
    .map((filter) => {
      const { attribute, operator, value } = filter as CompleteFilter;

      if (operator.value === OperatorKind.in) {
        return `${attribute.value}=~"${value.value}"`;
      }

      // TODO: use "attribute-operator" FilterKind? We still set a value for these filters that we could use here.
      if (operator.value === OperatorKind['is-empty']) {
        return `${attribute.value}=""`;
      }

      return `${attribute.value}${operator.value}"${value.value}"`;
    });

  const [, serviceNameLabel] = query.match(/{.*(service_name="[^"]*").*}/) ?? [];

  if (serviceNameLabel) {
    labelsList.unshift(serviceNameLabel);
  }

  return query.replace(/{(.*)}$/, `{${labelsList.join(',')}}`);
}
