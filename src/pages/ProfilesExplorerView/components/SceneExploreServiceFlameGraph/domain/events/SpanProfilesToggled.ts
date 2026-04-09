import { BusEventWithPayload } from '@grafana/data';

export interface SpanProfilesToggledPayload {
  enabled: boolean;
}

export class SpanProfilesToggled extends BusEventWithPayload<SpanProfilesToggledPayload> {
  static type = 'span-profiles-toggled';
}
