import { CustomVariable, MultiValueVariable, SceneComponentProps } from '@grafana/scenes';
import { Cascader, CascaderOption } from '@grafana/ui';
import { userStorage } from '@shared/infrastructure/userStorage';
import React from 'react';
import { of } from 'rxjs';

import { ProfileMetricOptions } from '../../getProfileMetricOptions';

export class ProfileMetricVariable extends CustomVariable {
  constructor({ options, value }: { options: ProfileMetricOptions; value: string }) {
    super({
      name: 'profileMetric',
      label: '🔥 Profile',
      isMulti: false,
      // can't build Cascader options here (or in getValueOptions()) because of Scenes var validation -> it would default options[0].value
      // which is not complete "alerting-ops" vs "alerting-ops/grafana"
      // options: ServiceNameVariable.buildCascaderOptions(options),
      options,
      value,
    });
  }

  // TODO: any
  static buildCascaderOptions(options: any): CascaderOption[] {
    const optionsMap = new Map();

    for (const { value, group, type } of options) {
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

  getValueOptions() {
    return of(this.state.options);
  }

  public static Component = ({ model }: SceneComponentProps<MultiValueVariable>) => {
    const { options, value } = model.useState();

    const onSelect = (newValue: string) => {
      model.changeValueTo(newValue, newValue);

      const storage = userStorage.get(userStorage.KEYS.PROFILES_EXPLORER) || {};
      storage.profileMetric = newValue;
      userStorage.set(userStorage.KEYS.PROFILES_EXPLORER, storage);
    };

    return (
      <Cascader
        aria-label="Profile metrics list"
        width={32}
        separator="/"
        displayAllSelectedLevels
        placeholder="Select a profile metric"
        options={ProfileMetricVariable.buildCascaderOptions(options)}
        initialValue={value as string}
        changeOnSelect={false}
        onSelect={onSelect}
      />
    );
  };
}
