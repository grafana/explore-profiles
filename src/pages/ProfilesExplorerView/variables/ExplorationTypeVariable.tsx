import { CustomVariable, MultiValueVariable, SceneComponentProps } from '@grafana/scenes';
import { RadioButtonGroup } from '@grafana/ui';
import React from 'react';

export enum ExplorationType {
  ALL_SERVICES = 'all-services',
  SINGLE_SERVICE = 'single-services',
  FAVORITES = 'favorites',
}

export class ExplorationTypeVariable extends CustomVariable {
  static OPTIONS = [
    {
      value: ExplorationType.ALL_SERVICES,
      label: 'All services',
    },
    {
      value: ExplorationType.SINGLE_SERVICE,
      label: 'Single service',
    },
    {
      value: ExplorationType.FAVORITES,
      label: 'Favorites',
    },
  ];

  static DEFAULT_VALUE = ExplorationType.ALL_SERVICES;

  constructor() {
    super({
      name: 'explorationType',
      isMulti: false,
      label: 'Exploration type',
    });
  }

  static Component = ({ model }: SceneComponentProps<MultiValueVariable>) => {
    const { value } = model.useState();

    function onChange(newValue: any) {
      model.changeValueTo(newValue, newValue);
    }

    if (!Object.values(ExplorationType).includes(value as ExplorationType)) {
      onChange(ExplorationTypeVariable.DEFAULT_VALUE);
    }

    return (
      <RadioButtonGroup options={ExplorationTypeVariable.OPTIONS} value={value} fullWidth={false} onChange={onChange} />
    );
  };
}
