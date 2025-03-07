import { CustomVariable } from '@grafana/scenes';

export class SpanSelectorVariable extends CustomVariable {
  constructor() {
    super({
      key: 'spanSelector',
      name: 'spanSelector',
      label: 'Span selector',
      value: undefined,
    });
  }

  reset() {
    this.setState({ value: undefined });
  }
}
