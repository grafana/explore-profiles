import { AppEvents } from '@grafana/data';
import { getAppEvents } from '@grafana/runtime';

export function displayError(error: unknown, msgs: string[]) {
  console.error(msgs);
  console.error(error);

  getAppEvents().publish({
    type: AppEvents.alertError.name,
    payload: msgs,
  });
}

export function displayWarning(msgs: string[]) {
  console.warn(msgs);

  getAppEvents().publish({
    type: AppEvents.alertWarning.name,
    payload: msgs,
  });
}

export function displaySuccess(msgs: string[]) {
  console.info(msgs);

  getAppEvents().publish({
    type: AppEvents.alertSuccess.name,
    payload: msgs,
  });
}
