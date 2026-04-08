import { CompleteFilter, FilterKind, Filters, OperatorKind } from '../types';
import { quoteLabelName } from './quoteLabelName';

export function filtersToQuery(query: string, filters: Filters) {
  const labelsList = filters
    .filter(({ type }) => type !== FilterKind.partial)
    .map((filter) => {
      const { attribute, operator, value } = filter as CompleteFilter;

      const quotedAttr = quoteLabelName(attribute.value);

      switch (operator.value) {
        case OperatorKind.in:
          return `${quotedAttr}=~"${value.value}"`;

        case OperatorKind['not-in']:
          return `${quotedAttr}!~"${value.value}"`;

        case OperatorKind['is-empty']:
          return `${quotedAttr}=""`;

        default:
          return `${quotedAttr}${operator.value}"${value.value}"`;
      }
    });

  const [, serviceNameLabel] = query.match(/{.*(service_name="[^"]*").*}/) ?? [];

  if (serviceNameLabel) {
    labelsList.unshift(serviceNameLabel);
  }

  return query.replace(/{(.*)}$/, `{${labelsList.join(',')}}`);
}
