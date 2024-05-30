import { MultiValueVariable, QueryVariable, SceneComponentProps } from '@grafana/scenes';
import { Cascader, CascaderOption } from '@grafana/ui';
import { getProfileMetric, ProfileMetricId } from '@shared/infrastructure/profile-metrics/getProfileMetric';
import React, { useMemo } from 'react';

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
    });

    this.addActivationHandler(() => {
      this.setState({ value: initialValue });
    });
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
    const { loading, value, options } = model.useState();

    const cascaderOptions = useMemo(() => {
      return ProfileMetricVariable.buildCascaderOptions(options as ProfileMetricOptions);
    }, [options]);

    function onSelect(newValue: any) {
      model.changeValueTo(newValue, newValue);
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
        onSelect={onSelect}
      />
    );
  };
}
