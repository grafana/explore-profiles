import { BusEventWithPayload } from '@grafana/data';

export interface RemoveProfileIdSelectorPayload {}

export class RemoveProfileIdSelector extends BusEventWithPayload<RemoveProfileIdSelectorPayload> {
  public static type = 'remove-profile-id-selector';
}
