import { locationService } from '@grafana/runtime';

// Use the same location instance as grafana
export const history = locationService.getHistory();
