import { css } from '@emotion/css';
import { GrafanaTheme2 } from '@grafana/data';
import {
  MultiValueVariable,
  QueryVariable,
  SceneComponentProps,
  sceneGraph,
  VariableValueOption,
} from '@grafana/scenes';
import { Cascader, CascaderOption, Icon, Tooltip, useStyles2 } from '@grafana/ui';
import { getProfileMetric, ProfileMetricId } from '@shared/infrastructure/profile-metrics/getProfileMetric';
import React, { useMemo } from 'react';
import { lastValueFrom } from 'rxjs';

import { PYROSCOPE_PROFILE_METRICS_DATA_SOURCE } from '../data/pyroscope-data-sources';

type ProfileMetricOptions = Array<{
  value: string;
  label: string;
  type: string;
  group: string;
}>;

export class ProfileMetricVariable extends QueryVariable {
  static DEFAULT_VALUE = 'process_cpu:cpu:nanoseconds:cpu:nanoseconds';

  constructor({ value }: { value?: string }) {
    // hack: the variable does not sync, if the "var-profileMetricId" search parameter is present in the URL, it is set to an empty value
    const initialValue =
      value ||
      new URLSearchParams(window.location.search).get('var-profileMetricId') ||
      ProfileMetricVariable.DEFAULT_VALUE;

    super({
      name: 'profileMetricId',
      label: '🔥 Profile',
      datasource: PYROSCOPE_PROFILE_METRICS_DATA_SOURCE,
      query: 'list', // dummy query, can't be an empty string
      loading: true,
      value: initialValue,
    });

    this.addActivationHandler(() => {
      const sub = sceneGraph.getTimeRange(this).subscribeToState(async () => {
        this.update();
      });

      return () => {
        sub.unsubscribe();
      };
    });
  }

  async update() {
    let options: VariableValueOption[] = [];
    let error = null;

    this.setState({ loading: true });

    try {
      options = await lastValueFrom(this.getValueOptions({}));
    } catch (e) {
      error = e;
    } finally {
      this.setState({ loading: false, options, error });
    }

    // empty string to show the user the previous value is not available anymore
    const value = options.some(({ value }) => value === this.state.value) ? this.state.value : '';

    this.changeValueTo(value, value);
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

    return Array.from(optionsMap.values()).sort((a, b) => a.label.localeCompare(b.label));
  }

  static Component = ({ model }: SceneComponentProps<MultiValueVariable>) => {
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
        onSelect={(newValue: string) => model.changeValueTo(newValue, newValue)}
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
