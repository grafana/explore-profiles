import { AppEvents } from '@grafana/data';
import { getAppEvents } from '@grafana/runtime';

export function reportError(msgs: string[], error?: unknown) {
  console.error('File upload error!', msgs);
  console.error(error);

  getAppEvents().publish({
    type: AppEvents.alertError.name,
    payload: msgs,
  });
}
