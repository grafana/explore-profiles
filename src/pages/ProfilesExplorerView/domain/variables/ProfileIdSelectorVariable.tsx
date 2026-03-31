import { t } from '@grafana/i18n';
import { CustomVariable } from '@grafana/scenes';

export class ProfileIdSelectorVariable extends CustomVariable {
  constructor() {
    super({
      key: 'profileIdSelector',
      name: 'profileIdSelector',
      label: t('variables.profile-id-selector.label', 'Profile Id Selector'),
      value: undefined,
    });
  }

  reset() {
    this.setState({ value: undefined });
  }
}
