import { CustomVariable, MultiValueVariable, SceneComponentProps } from '@grafana/scenes';
import { Cascader, CascaderOption } from '@grafana/ui';
import { buildServiceNameCascaderOptions } from '@shared/components/Toolbar/domain/useBuildServiceNameOptions';
import { noOp } from '@shared/domain/noOp';
import React from 'react';

import { SceneProfilesExplorerState } from '../SceneProfilesExplorer';

export class ServiceNameVariable extends CustomVariable {
  constructor() {
    // hack: the variable does not sync, if the "var-serviceName" search parameter is present in the URL, it is set to an empty value
    const value = new URLSearchParams(window.location.search).get('var-serviceName') || '';

    super({
      name: 'serviceName',
      isMulti: false,
      label: 'Service',
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

  update(services: SceneProfilesExplorerState['services']) {
    this.setState({
      // hack: see constructor
      options: services.isLoading ? undefined : buildServiceNameCascaderOptions(services.data),
      value: this.state.value || services.data[0],
    });
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
        aria-label="Services list"
        width={32}
        placeholder="Loading metrics..."
        options={[]}
        onSelect={noOp}
      />
    ) : (
      <Cascader
        key="loaded-cascader"
        aria-label="Services list"
        width={32}
        separator="/"
        displayAllSelectedLevels
        placeholder={`Select a service (${options.length})`}
        options={options as CascaderOption[]}
        initialValue={value as string}
        changeOnSelect={false}
        onSelect={onSelect}
      />
    );
  };
}
