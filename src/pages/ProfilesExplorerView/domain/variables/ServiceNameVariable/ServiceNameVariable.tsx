import { css } from '@emotion/css';
import { GrafanaTheme2, VariableRefresh } from '@grafana/data';
import {
  MultiValueVariable,
  QueryVariable,
  SceneComponentProps,
  sceneGraph,
  VariableValueOption,
} from '@grafana/scenes';
import { Cascader, Icon, Tooltip, useStyles2 } from '@grafana/ui';
import { prepareHistoryEntry } from '@shared/domain/prepareHistoryEntry';
import { reportInteraction } from '@shared/domain/reportInteraction';
import { userStorage } from '@shared/infrastructure/userStorage';
import React, { useMemo } from 'react';
import { lastValueFrom } from 'rxjs';

import { PYROSCOPE_SERIES_DATA_SOURCE } from '../../../infrastructure/pyroscope-data-sources';
import { FiltersVariable } from '../FiltersVariable/FiltersVariable';
import { buildServiceNameCascaderOptions } from './domain/useBuildServiceNameOptions';

type ServiceNameVariableState = {
  query: string;
  skipUrlSync: boolean;
};

export class ServiceNameVariable extends QueryVariable {
  // hack: subscribe to changes of dataSource only
  static QUERY_DEFAULT = '$dataSource and all services';

  // hack: subscribe to changes of dataSource and profileMetricId
  static QUERY_PROFILE_METRIC_DEPENDENT = '$dataSource and only $profileMetricId services';

  constructor(state?: ServiceNameVariableState) {
    super({
      key: 'serviceName',
      name: 'serviceName',
      label: 'Service',
      datasource: PYROSCOPE_SERIES_DATA_SOURCE,
      query: ServiceNameVariable.QUERY_DEFAULT,
      loading: true,
      refresh: VariableRefresh.onTimeRangeChanged,
      ...state,
    });

    this.addActivationHandler(this.onActivate.bind(this));
  }

  onActivate() {
    const { serviceName: serviceNameFromStorage } = userStorage.get(userStorage.KEYS.PROFILES_EXPLORER) || {};

    if (serviceNameFromStorage) {
      this.setState({ value: serviceNameFromStorage });
    }

    this.subscribeToState((newState, prevState) => {
      if (newState.value && newState.value !== prevState.value) {
        const storage = userStorage.get(userStorage.KEYS.PROFILES_EXPLORER) || {};
        storage.serviceName = newState.value;
        userStorage.set(userStorage.KEYS.PROFILES_EXPLORER, storage);
      }
    });
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

  selectNewValue = (newValue: string) => {
    reportInteraction('g_pyroscope_app_service_name_selected');

    if (!this.state.skipUrlSync) {
      prepareHistoryEntry();
    }
    this.changeValueTo(newValue);

    // manually reset filters - we should listen to the variables changes but it leads to unwanted behaviour
    // (filters set in the URL search parameters are resetted when the user lands on the page)
    ['filters', 'filtersBaseline', 'filtersComparison'].forEach((filterKey) => {
      const filtersVariable = sceneGraph.findByKeyAndType(this, filterKey, FiltersVariable);
      filtersVariable.setState({ filters: [] });
    });
  };

  static Component = ({ model }: SceneComponentProps<MultiValueVariable & { selectNewValue?: any }>) => {
    const styles = useStyles2(getStyles);
    const { loading, value, options, error } = model.useState();

    const cascaderOptions = useMemo(
      () => buildServiceNameCascaderOptions(options.map(({ label }) => label)),
      [options]
    );

    if (error) {
      console.error('Error while loading "serviceName" variable values!');
      console.error(error);

      return (
        <Tooltip theme="error" content={error.toString()}>
          <Icon className={styles.iconError} name="exclamation-triangle" size="xl" />
        </Tooltip>
      );
    }

    return (
      <Cascader
        // we add a key to ensure that the Cascader selects the initial value properly when landing on the page
        // and when switching exploration types, because the value might also be changed after the component has been rendered by SceneProfilesExplorer
        // (e.g. in SceneExploreServiceProfileTypes)
        key={String(loading) + String(value)}
        aria-label="Services list"
        width={32}
        separator="/"
        displayAllSelectedLevels
        placeholder={loading ? 'Loading services...' : `Select a service (${options.length})`}
        options={cascaderOptions}
        initialValue={value as string}
        changeOnSelect={false}
        onSelect={model.selectNewValue}
      />
    );
  };
}

const getStyles = (theme: GrafanaTheme2) => ({
  iconError: css`
    height: 32px;
    align-self: center;
    color: ${theme.colors.error.text};
  `,
});
