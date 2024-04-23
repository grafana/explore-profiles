import { CustomVariable, MultiValueVariable, SceneComponentProps, VariableValueOption } from '@grafana/scenes';
import { Cascader, CascaderOption } from '@grafana/ui';
import { userStorage } from '@shared/infrastructure/userStorage';
import React from 'react';
import { of } from 'rxjs';

import { ServiceOptions } from '../../getServiceOptions';

export class ServiceNameVariable extends CustomVariable {
  constructor({ options, value }: { options: ServiceOptions; value: string }) {
    super({
      name: 'serviceName',
      label: '💡 Service',
      isMulti: false,
      // can't build Cascader options here (or in getValueOptions()) because of Scenes var validation -> it would default options[0].value
      // which is not complete "alerting-ops" vs "alerting-ops/grafana"
      // options: ServiceNameVariable.buildCascaderOptions(options),
      options,
      value,
    });
  }

  static buildCascaderOptions(options: VariableValueOption[]): CascaderOption[] {
    // return this.state.options;

    const optionsMap = new Map();

    for (const { value } of options) {
      const [namespaceOrService, service] = (value as string).split('/');

      if (!service) {
        optionsMap.set(namespaceOrService, {
          value,
          label: value,
        });
      } else {
        const nameSpaceServices = optionsMap.get(namespaceOrService) || {
          value: namespaceOrService,
          label: namespaceOrService,
          items: [],
        };

        const items = nameSpaceServices.items || [];

        items.push({
          value,
          label: service,
        });

        nameSpaceServices.items = items;

        optionsMap.set(namespaceOrService, nameSpaceServices);
      }
    }

    return Array.from(optionsMap.values());
  }

  getValueOptions() {
    return of(this.state.options);
  }

  public static Component = ({ model }: SceneComponentProps<MultiValueVariable>) => {
    const { options, value } = model.useState();

    const onSelect = (newValue: string) => {
      model.changeValueTo(newValue, newValue);

      const storage = userStorage.get(userStorage.KEYS.PROFILES_EXPLORER) || {};
      storage.service = newValue;
      userStorage.set(userStorage.KEYS.PROFILES_EXPLORER, storage);
    };

    return (
      <Cascader
        aria-label="Services list"
        width={32}
        separator="/"
        displayAllSelectedLevels
        placeholder="Select a service"
        options={ServiceNameVariable.buildCascaderOptions(options)}
        initialValue={value as string}
        changeOnSelect={false}
        onSelect={onSelect}
      />
    );
  };
}
