import { css } from '@emotion/css';
import { GrafanaTheme2, VariableRefresh } from '@grafana/data';
import { MultiValueVariable, QueryVariable, SceneComponentProps, VariableValueOption } from '@grafana/scenes';
import { Cascader, CascaderOption, Icon, Tooltip, useStyles2 } from '@grafana/ui';
import { getProfileMetric, ProfileMetricId } from '@shared/infrastructure/profile-metrics/getProfileMetric';
import React, { useMemo } from 'react';
import { lastValueFrom } from 'rxjs';

import { PYROSCOPE_SERIES_DATA_SOURCE } from '../data/pyroscope-data-sources';
import { findSceneObjectByClass } from '../helpers/findSceneObjectByClass';
import { ProfilesDataSourceVariable } from './ProfilesDataSourceVariable';

type ProfileMetricOptions = Array<{
  value: string;
  label: string;
  type: string;
  group: string;
}>;

export class ProfileMetricVariable extends QueryVariable {
  static DEFAULT_VALUE = 'process_cpu:cpu:nanoseconds:cpu:nanoseconds';

  constructor() {
    super({
      name: 'profileMetricId',
      label: '🔥 Profile',
      datasource: PYROSCOPE_SERIES_DATA_SOURCE,
      query: 'profileMetricId',
      loading: true,
      refresh: VariableRefresh.onTimeRangeChanged,
    });

    this.addActivationHandler(this.onActivate.bind(this));
  }

  onActivate() {
    if (!this.state.value) {
      this.setState({ value: ProfileMetricVariable.DEFAULT_VALUE });
    }

    // VariableDependencyConfig does not work :man_shrug: (never called)
    const dataSourceSub = (
      findSceneObjectByClass(this, ProfilesDataSourceVariable) as ProfilesDataSourceVariable
    ).subscribeToState(() => this.update(true));

    return () => {
      dataSourceSub.unsubscribe();
    };
  }

  async update(selectDefaultValue = false) {
    let options: VariableValueOption[] = [];
    let error = null;

    this.changeValueTo('', '');

    this.setState({ loading: true });

    try {
      options = await lastValueFrom(this.getValueOptions({}));
    } catch (e) {
      error = e;
    } finally {
      this.setState({ loading: false, options, error });

      if (selectDefaultValue) {
        this.changeValueTo(ProfileMetricVariable.DEFAULT_VALUE, ProfileMetricVariable.DEFAULT_VALUE);
      }
    }
  }

  static buildCascaderOptions(options: ProfileMetricOptions): CascaderOption[] {
    const optionsMap = new Map();

    for (const { value } of options) {
      const profileMetric = getProfileMetric(value as ProfileMetricId);
      const { group, type } = profileMetric;

      const nameSpaceServices = optionsMap.get(group) || {
        value: group,
        label: group,
        items: [],
      };

      const items = nameSpaceServices.items || [];

      items.push({
        value,
        label: type,
      });

      nameSpaceServices.items = items;

      optionsMap.set(group, nameSpaceServices);
    }

    return Array.from(optionsMap.values()).sort((a, b) => b.label.localeCompare(a.label));
  }

  selectNewValue = (newValue: string) => {
    this.changeValueTo(newValue, newValue);
  };

  static Component = ({ model }: SceneComponentProps<MultiValueVariable & { selectNewValue?: any }>) => {
    const styles = useStyles2(getStyles);
    const { loading, value, options, error } = model.useState();

    const cascaderOptions = useMemo(() => {
      return ProfileMetricVariable.buildCascaderOptions(options as ProfileMetricOptions);
    }, [options]);

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
        // we do this to ensure that the Cascader selects the initial value properly
        key={String(loading)}
        aria-label="Profile metrics list"
        width={32}
        separator="/"
        displayAllSelectedLevels
        placeholder={loading ? 'Loading profile metrics...' : `Select a profile metric (${options.length})`}
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
    color: ${theme.colors.error.text};
    align-self: center;
  `,
});
