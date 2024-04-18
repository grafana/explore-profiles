import { CustomVariable } from '@grafana/scenes';
import { of } from 'rxjs';

export class ServiceNameVariable extends CustomVariable {
  getValueOptions() {
    return of(this.state.options);
  }
}
