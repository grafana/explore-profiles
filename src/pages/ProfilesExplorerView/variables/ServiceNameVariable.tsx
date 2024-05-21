import { CustomVariable, MultiValueVariable, SceneComponentProps } from '@grafana/scenes';
import { Cascader, CascaderOption, Select } from '@grafana/ui';
import { buildServiceNameCascaderOptions } from '@shared/components/Toolbar/domain/useBuildServiceNameOptions';
import { noOp } from '@shared/domain/noOp';
import React from 'react';

import { SceneProfilesExplorerState } from '../SceneProfilesExplorer';

export class ServiceNameVariable extends CustomVariable {
  constructor() {
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
      });
    });
  }

  update(services: SceneProfilesExplorerState['services']) {
    this.setState({
      // hack: see constructor
      options: services.isLoading ? undefined : buildServiceNameCascaderOptions(services.data),
    });
  }

  static Component = ({ model }: SceneComponentProps<MultiValueVariable>) => {
    const { value, options } = model.useState();

    function onSelect(newValue: any) {
      model.changeValueTo(newValue, newValue);
    }

    if (!value && options?.length) {
      onSelect(options[0]);
    }

    // hack: see constructor
    return options === undefined ? (
      <Select aria-label="Services list" width={32} placeholder="Loading services..." options={[]} onChange={noOp} />
    ) : (
      <Cascader
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
