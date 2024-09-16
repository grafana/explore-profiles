import { FunctionDetails } from '../../domain/types/FunctionDetails';
import { getTotalSum } from './getTotalSum';

export const sortByTotal = (a: FunctionDetails, b: FunctionDetails) => getTotalSum(b) - getTotalSum(a);
