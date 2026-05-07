import { t } from '@grafana/i18n';
import { CustomVariable } from '@grafana/scenes';

const SPAN_SELECTOR_LABEL_DEFAULT = 'Span selector';

export class SpanSelectorVariable extends CustomVariable {
  constructor() {
    super({
      key: 'spanSelector',
      name: 'spanSelector',
      label: SPAN_SELECTOR_LABEL_DEFAULT,
      value: undefined,
    });

    this.addActivationHandler(this.onActivate.bind(this));
  }

  private onActivate() {
    this.setState({ label: t('variables.span-selector.label', SPAN_SELECTOR_LABEL_DEFAULT) });
  }

  reset() {
    this.setState({ value: undefined });
  }
}
