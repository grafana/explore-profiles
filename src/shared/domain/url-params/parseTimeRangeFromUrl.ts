import { translatePyroscopeTimeRangeToGrafana } from '../translation';

export const parseTimeRangeFromUrl = (paramNames: string[], searchParams: URLSearchParams) =>
  translatePyroscopeTimeRangeToGrafana(searchParams.get(paramNames[0]) ?? '', searchParams.get(paramNames[1]) ?? '');
