import { CustomVariable, MultiValueVariable, SceneComponentProps } from '@grafana/scenes';
import { Cascader, CascaderOption } from '@grafana/ui';
import { noOp } from '@shared/domain/noOp';
import React from 'react';

import { SceneProfilesExplorerState } from '../SceneProfilesExplorer';

export class ProfileMetricVariable extends CustomVariable {
  static DEFAULT_VALUE = 'process_cpu:cpu:nanoseconds:cpu:nanoseconds';

  constructor() {
    // hack: the variable does not sync, if the "var-profileMetricId" search parameter is present in the URL, it is set to an empty value
    const value =
      new URLSearchParams(window.location.search).get('var-profileMetricId') || ProfileMetricVariable.DEFAULT_VALUE;

    super({
      name: 'profileMetricId',
      isMulti: false,
      label: '🔥 Profile',
    });

    this.addActivationHandler(() => {
      this.setState({
        // hack: we use undefined to monitor loading status - couldn't make it work by using the custom variable state
        // where "loading" & "error" should exist :man_shrug:
        options: undefined,
        value,
      });
    });
  }

  update(profileMetrics: SceneProfilesExplorerState['profileMetrics']) {
    this.setState({
      // hack: see constructor
      options: profileMetrics.isLoading ? undefined : ProfileMetricVariable.buildCascaderOptions(profileMetrics),
      value: this.state.value || ProfileMetricVariable.DEFAULT_VALUE,
    });
  }

  static buildCascaderOptions(profileMetrics: SceneProfilesExplorerState['profileMetrics']): CascaderOption[] {
    const optionsMap = new Map();

    for (const { value, group, type } of profileMetrics.data) {
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
    const { value, options } = model.useState();

    function onSelect(newValue: any) {
      model.changeValueTo(newValue, newValue);
    }

    // hack: see constructor
    return options === undefined ? (
      <Cascader
        key="loading-cascader"
        aria-label="Profile metrics list"
        width={32}
        placeholder="Loading profile metrics..."
        options={[]}
        onSelect={noOp}
      />
    ) : (
      <Cascader
        key="loaded-cascader"
        aria-label="Profile metrics list"
        width={32}
        separator="/"
        displayAllSelectedLevels
        placeholder={`Select a metric (${options.length})`}
        options={options as CascaderOption[]}
        initialValue={value as string}
        changeOnSelect={false}
        onSelect={onSelect}
      />
    );
  };
}
