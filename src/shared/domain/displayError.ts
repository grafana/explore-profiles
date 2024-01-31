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
