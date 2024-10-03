import { OperatorKind } from '../types';

export const isMultipleValuesOperator = (operator: string | OperatorKind) =>
  operator === OperatorKind['in'] || operator === OperatorKind['not-in'];
