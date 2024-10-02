import { OperatorKind } from '../types';

export const isRegexValueOperator = (operator: string | OperatorKind) =>
  operator === OperatorKind['=~'] || operator === OperatorKind['!~'];
