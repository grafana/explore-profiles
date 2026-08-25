import { dateMath } from '@grafana/data';
import { t } from '@grafana/i18n';
import { displayError } from '@shared/domain/displayStatus';

import { getDefaultTimeRange } from '../../../..//domain/buildTimeRange';

export function builsShareableUrl(): URL {
  const shareableUrl = new URL(window.location.toString());
  const { searchParams } = shareableUrl;

  if (!searchParams.get('from')) {
    searchParams.set('from', getDefaultTimeRange().from);
  }
  if (!searchParams.get('to')) {
    searchParams.set('to', getDefaultTimeRange().to);
  }

  ['from', 'to', 'from-2', 'to-2', 'from-3', 'to-3', 'diffFrom', 'diffTo', 'diffFrom-2', 'diffTo-2'].forEach((name) => {
    const value = searchParams.get(name);
    if (!value) {
      return;
    }

    const parsed = dateMath.toDateTime(value, {});
    if (parsed?.isValid()) {
      searchParams.set(name, String(parsed.valueOf()));
    }
  });

  return shareableUrl;
}

/**
 * ClipboardButton calls getText() outside its clipboard error handler, so this
 * wrapper reports build failures instead of letting them escape the click handler.
 */
export function getShareableUrlText(): string {
  try {
    return builsShareableUrl().toString();
  } catch (error) {
    displayError(error as Error, [
      t('explorer.header.share-error', 'Error while copying the shareable link to the clipboard!'),
    ]);
    return window.location.toString();
  }
}
