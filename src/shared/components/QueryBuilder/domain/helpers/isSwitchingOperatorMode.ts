import { invariant } from '../../../../types/helpers/invariant';
import { Filter, OperatorKind } from '../types';

/**
 * Determines if we switch from strict operators (=, !=) to loose ones (=~)
 *
 * This is used when/after editing a filter:
 * - to determine to which state to transition to (see states/loadOperators.ts and domain/guards.ts)
 * - to set the correct edition data after the switch (see domain/actions.ts - editFilterOperator)
 *
 * Returns true when the value should be edited after the switch
 */
export function isEditingOperatorMode(currentOperator: string, newOperator: string) {
  if (currentOperator === newOperator) {
    return false;
  }

  if (newOperator === OperatorKind['is-empty']) {
    return false;
  }

  return (
    [
      OperatorKind['=~'],
      OperatorKind['!~'],
      OperatorKind['in'],
      OperatorKind['not-in'],
      OperatorKind['is-empty'],
    ].includes(currentOperator as OperatorKind) ||
    [OperatorKind['=~'], OperatorKind['!~'], OperatorKind['in'], OperatorKind['not-in']].includes(
      newOperator as OperatorKind
    )
  );
}

export function isSwitchingOperatorMode(filterUnderEdition: Filter, newOperator: string) {
  invariant(typeof filterUnderEdition.operator !== 'undefined', 'No operator for the filter under edition!');

  const currentOperator = filterUnderEdition.operator.value;

  return isEditingOperatorMode(currentOperator, newOperator);
}
