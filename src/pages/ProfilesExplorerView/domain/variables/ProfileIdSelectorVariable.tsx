import { t } from '@grafana/i18n';
import { CustomVariable } from '@grafana/scenes';

const PROFILE_ID_SELECTOR_LABEL_DEFAULT = 'Profile Id Selector';

export class ProfileIdSelectorVariable extends CustomVariable {
  constructor() {
    super({
      key: 'profileIdSelector',
      name: 'profileIdSelector',
      label: PROFILE_ID_SELECTOR_LABEL_DEFAULT,
      value: undefined,
    });

    this.addActivationHandler(this.onActivate.bind(this));
  }

  private onActivate() {
    this.setState({ label: t('variables.profile-id-selector.label', PROFILE_ID_SELECTOR_LABEL_DEFAULT) });
  }

  reset() {
    this.setState({ value: undefined });
  }
}
