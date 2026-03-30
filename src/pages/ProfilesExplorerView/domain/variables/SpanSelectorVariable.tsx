import { t } from '@grafana/i18n';
import { CustomVariable } from '@grafana/scenes';

export class SpanSelectorVariable extends CustomVariable {
  constructor() {
    super({
      key: 'spanSelector',
      name: 'spanSelector',
      label: t('variables.span-selector.label', 'Span selector'),
      value: undefined,
    });
  }

  reset() {
    this.setState({ value: undefined });
  }
}
