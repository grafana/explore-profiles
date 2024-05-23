import { CustomVariable, MultiValueVariable, SceneComponentProps } from '@grafana/scenes';
import { RadioButtonGroup } from '@grafana/ui';
import React from 'react';

export class ExplorationTypeVariable extends CustomVariable {
  static OPTIONS = [
    {
      value: 'all-services-exploration',
      label: 'All services',
    },
    {
      value: 'single-service-exploration',
      label: 'Single service',
    },
    {
      value: 'favorites-exploration',
      label: 'Favorites',
    },
  ];

  static DEFAULT_VALUE = ExplorationTypeVariable.OPTIONS[0].value;

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

    if (!value) {
      onChange(ExplorationTypeVariable.DEFAULT_VALUE);
    }

    return (
      <RadioButtonGroup options={ExplorationTypeVariable.OPTIONS} value={value} fullWidth={false} onChange={onChange} />
    );
  };
}
