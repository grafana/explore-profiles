import { css } from '@emotion/css';
import { AdHocVariableFilter, GrafanaTheme2, VariableRefresh } from '@grafana/data';
import { MultiValueVariable, QueryVariable, SceneComponentProps, VariableValueOption } from '@grafana/scenes';
import { Cascader, Icon, Tooltip, useStyles2 } from '@grafana/ui';
import { prepareHistoryEntry } from '@shared/domain/prepareHistoryEntry';
import { reportInteraction } from '@shared/domain/reportInteraction';
import { userStorage } from '@shared/infrastructure/userStorage';
import { nanoid } from 'nanoid';
import React, { useMemo } from 'react';
import { lastValueFrom } from 'rxjs';

import { PYROSCOPE_SERIES_DATA_SOURCE } from '../../../infrastructure/pyroscope-data-sources';
import { buildServiceNameCascaderOptions } from './domain/useBuildServiceNameOptions';

type ServiceNameVariableState = {
  query?: string;
  skipUrlSync?: boolean;
  initialFilters?: AdHocVariableFilter[];
  presetLabels?: string[];
  presetName?: string;
};

export class ServiceNameVariable extends QueryVariable {
  // hack: subscribe to changes of dataSource only
  static QUERY_DEFAULT = '$dataSource and all services';

  // hack: subscribe to changes of dataSource and profileMetricId
  static QUERY_PROFILE_METRIC_DEPENDENT = '$dataSource and only $profileMetricId services';

  /**
   * Builds a query string for fetching series with preset labels.
   * Format: "$dataSource preset [label1,label2,label3] and only $profileMetricId services"
   */
  static buildPresetQuery(presetLabels: string[], profileMetricDependent = false): string {
    const labelsStr = presetLabels.join(',');
    if (profileMetricDependent) {
      return `$dataSource preset [${labelsStr}] and only $profileMetricId services`;
    }
    return `$dataSource preset [${labelsStr}] and all services`;
  }

  private initialFilters?: AdHocVariableFilter[];
  private presetLabels?: string[];
  private presetName?: string;

  constructor(state?: ServiceNameVariableState) {
    const presetLabels = state?.presetLabels;
    const isDefaultPreset = !presetLabels || (presetLabels.length === 1 && presetLabels[0] === 'service_name');

    // Determine the query based on preset and whether it's profile metric dependent
    let query = state?.query;
    if (!query) {
      query = isDefaultPreset
        ? ServiceNameVariable.QUERY_DEFAULT
        : ServiceNameVariable.buildPresetQuery(presetLabels!, false);
    }

    // Determine the label based on preset
    const label = state?.presetName || (isDefaultPreset ? 'Service' : presetLabels!.join(' / '));

    super({
      key: 'serviceName',
      name: 'serviceName',
      label,
      datasource: PYROSCOPE_SERIES_DATA_SOURCE,
      query,
      loading: true,
      refresh: VariableRefresh.onTimeRangeChanged,
      ...state,
    });

    this.initialFilters = state?.initialFilters;
    this.presetLabels = presetLabels;
    this.presetName = state?.presetName;
    this.addActivationHandler(this.onActivate.bind(this));
  }

  getPresetLabels(): string[] | undefined {
    return this.presetLabels;
  }

  /**
   * Updates the variable to use a new preset.
   * This changes the query and label to match the new preset.
   */
  updatePreset(presetLabels: string[], presetName?: string) {
    const isDefaultPreset = presetLabels.length === 1 && presetLabels[0] === 'service_name';
    const isProfileMetricDependent = this.state.query?.includes('$profileMetricId');

    const query = isDefaultPreset
      ? isProfileMetricDependent
        ? ServiceNameVariable.QUERY_PROFILE_METRIC_DEPENDENT
        : ServiceNameVariable.QUERY_DEFAULT
      : ServiceNameVariable.buildPresetQuery(presetLabels, isProfileMetricDependent);

    const label = presetName || (isDefaultPreset ? 'Service' : presetLabels.join(' / '));

    this.presetLabels = presetLabels;
    this.presetName = presetName;
    this.setState({ query, label });

    // Trigger a refresh to fetch new data
    this.update();
  }

  onActivate() {
    this.setInitialValue();

    this.subscribeToState((newState, prevState) => {
      if (newState.value && newState.value !== prevState.value) {
        const storage = userStorage.get(userStorage.KEYS.PROFILES_EXPLORER) || {};
        storage.serviceName = newState.value;
        userStorage.set(userStorage.KEYS.PROFILES_EXPLORER, storage);
      }
    });
  }

  setInitialValue() {
    const { serviceName: serviceNameFromStorage } = userStorage.get(userStorage.KEYS.PROFILES_EXPLORER) || {};

    const initialServiceName = this.initialFilters?.find(
      (filter: AdHocVariableFilter) => filter.key === 'service_name' && filter.operator === '='
    )?.value;

    if (serviceNameFromStorage && !this.state.value && !initialServiceName) {
      this.setState({ value: serviceNameFromStorage });
    } else if (initialServiceName) {
      this.setState({ value: initialServiceName });
    }
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
  };

  static Component = ({ model }: SceneComponentProps<MultiValueVariable & { selectNewValue?: any; getPresetLabels?: () => string[] | undefined }>) => {
    const styles = useStyles2(getStyles);
    const { loading, value, options, error, label } = model.useState();

    const cascaderOptions = useMemo(
      () => buildServiceNameCascaderOptions(options.map(({ label }) => label)),
      [options]
    );

    // Use the label from state for placeholder, or default to "service"
    const itemName = label || 'service';
    const placeholder = loading ? `Loading ${itemName}...` : `Select ${itemName} (${options.length})`;

    if (error) {
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
        key={nanoid(5)}
        aria-label={`${itemName} list`}
        width={32}
        separator="/"
        displayAllSelectedLevels
        placeholder={placeholder}
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
