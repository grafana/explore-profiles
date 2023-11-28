import { Filter } from '../types';
import { invariant } from './invariant';

export function isSwitchingOperatorMode(filterUnderEdition: Filter, newOperator: string) {
  invariant(typeof filterUnderEdition.operator !== 'undefined', 'No operator for the filter under edition!');

  const currentOperator = filterUnderEdition.operator.value;

  return ['=~', '!~', 'in'].includes(currentOperator) || ['=~', '!~', 'in'].includes(newOperator);
}
