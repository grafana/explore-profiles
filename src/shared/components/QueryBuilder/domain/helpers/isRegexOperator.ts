import { OperatorKind } from '../types';

export const isRegexOperator = (operator: string | OperatorKind) =>
  operator === OperatorKind['=~'] || operator === OperatorKind['!~'];
