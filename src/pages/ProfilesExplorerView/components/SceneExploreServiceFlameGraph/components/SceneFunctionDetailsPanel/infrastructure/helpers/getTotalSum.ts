import { FunctionDetails } from '../../domain/types/FunctionDetails';

export const getTotalSum = (fd: FunctionDetails): number =>
  Array.from(fd.callSites.values()).reduce((acc, { cum }) => acc + cum, 0);
