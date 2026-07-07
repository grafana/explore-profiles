import { VariableRefresh } from '@grafana/data';
import { t } from '@grafana/i18n';
import { QueryVariable, VariableValueOption } from '@grafana/scenes';
import { lastValueFrom } from 'rxjs';

import { PYROSCOPE_FAVORITES_DATA_SOURCE } from '../../infrastructure/pyroscope-data-sources';

const FAVORITE_LABEL_DEFAULT = '🔖 Favorite';

export class FavoriteVariable extends QueryVariable {
  constructor() {
    super({
      name: 'favorite',
      label: FAVORITE_LABEL_DEFAULT,
      datasource: PYROSCOPE_FAVORITES_DATA_SOURCE,
      // "hack": we want to subscribe to changes of dataSource
      query: '$dataSource',
      loading: true,
      refresh: VariableRefresh.never,
      skipUrlSync: true,
    });

    this.addActivationHandler(this.onActivate.bind(this));
  }

  private onActivate() {
    this.setState({ label: t('variables.favorite.label', FAVORITE_LABEL_DEFAULT) });
  }

  async update() {
    if (this.state.loading) {
      return;
    }

    let options: VariableValueOption[] = [];
    let error = null;

    this.setState({ loading: true, options: [], error: null });

    try {
      options = await lastValueFrom(this.getValueOptions({}));
    } catch (e) {
      error = e;
    } finally {
      this.setState({ loading: false, options, error });
    }
  }
}
