import { toUtc } from '@grafana/data';
import { SceneObjectUrlValue } from '@grafana/scenes';

const INTERVAL_STRING_REGEX = /^\d+[yYmMsSwWhHdD]$/;

/* Copied from https://github.com/grafana/scenes/blob/main/packages/scenes/src/utils/parseUrlParam.ts */

// eslint-disable-next-line sonarjs/cognitive-complexity
export function parseUrlParam(value: SceneObjectUrlValue): string | null {
  if (typeof value !== 'string') {
    return null;
  }

  if (value.indexOf('now') !== -1) {
    return value;
  }

  if (INTERVAL_STRING_REGEX.test(value)) {
    return value;
  }

  if (value.length === 8) {
    const utcValue = toUtc(value, 'YYYYMMDD');
    if (utcValue.isValid()) {
      return utcValue.toISOString();
    }
  } else if (value.length === 15) {
    const utcValue = toUtc(value, 'YYYYMMDDTHHmmss');
    if (utcValue.isValid()) {
      return utcValue.toISOString();
    }
  } else if (value.length === 24) {
    const utcValue = toUtc(value);
    return utcValue.toISOString();
  }

  const epoch = parseInt(value, 10);
  if (!isNaN(epoch)) {
    return toUtc(epoch).toISOString();
  }

  return null;
}
