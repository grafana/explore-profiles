import { AppEvents } from '@grafana/data';
import { getAppEvents } from '@grafana/runtime';
import { logger } from '@shared/infrastructure/tracking/logger';

export function displayError(error: Error, msgs: string[]) {
  const context = msgs.reduce((acc, msg, i) => ({ ...acc, [`info${i + 1}`]: msg }), { handheldBy: 'displayError' });

  logger.error(error, context);

  getAppEvents().publish({
    type: AppEvents.alertError.name,
    payload: msgs,
  });
}

export function displayWarning(msgs: string[]) {
  logger.warn(msgs);

  getAppEvents().publish({
    type: AppEvents.alertWarning.name,
    payload: msgs,
  });
}

export function displaySuccess(msgs: string[]) {
  getAppEvents().publish({
    type: AppEvents.alertSuccess.name,
    payload: msgs,
  });
}
