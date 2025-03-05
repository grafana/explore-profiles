import { BusEventWithPayload } from '@grafana/data';

export interface RemoveSpanSelectorPayload {}

export class RemoveSpanSelector extends BusEventWithPayload<RemoveSpanSelectorPayload> {
  public static type = 'diff-auto-select';
}
