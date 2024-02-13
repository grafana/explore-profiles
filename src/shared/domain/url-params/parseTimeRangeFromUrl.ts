import { translatePyroscopeTimeRangeToGrafana } from '../translation';
import { parseUrlSearchParams } from './parseUrlSearchParams';

export const parseTimeRangeFromUrl = (searchParams: URLSearchParams = parseUrlSearchParams()) =>
  translatePyroscopeTimeRangeToGrafana(searchParams.get('from') ?? '', searchParams.get('until') ?? '');
