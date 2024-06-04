import { MultiValueVariable, QueryVariable, SceneComponentProps, sceneGraph } from '@grafana/scenes';
import { Cascader } from '@grafana/ui';
import { buildServiceNameCascaderOptions } from '@shared/components/Toolbar/domain/useBuildServiceNameOptions';
import React, { useMemo } from 'react';
import { lastValueFrom } from 'rxjs';

import { PYROSCOPE_SERVICES_DATA_SOURCE } from '../data/pyroscope-data-sources';

export class ServiceNameVariable extends QueryVariable {
  constructor({ value }: { value?: string }) {
    // hack: the variable does not sync, if the "var-serviceName" search parameter is present in the URL, it is set to an empty value
    const initialValue = value || new URLSearchParams(window.location.search).get('var-serviceName') || '';

    super({
      name: 'serviceName',
      label: '🚀 Service',
      datasource: PYROSCOPE_SERVICES_DATA_SOURCE,
      query: 'list', // dummy query, can't be an empty string
      loading: true,
    });

    this.addActivationHandler(() => {
      this.setState({ value: initialValue });

      const sub = sceneGraph.getTimeRange(this).subscribeToState(async () => {
        this.setState({ loading: true });

        const options = await lastValueFrom(this.getValueOptions({}));

        this.setState({ loading: false, options });

        // empty string to show the user the previous value is not available anymore
        const value = options.some(({ value }) => value === this.state.value) ? this.state.value : '';

        this.changeValueTo(value, value);
      });

      return () => {
        sub.unsubscribe();
      };
    });
  }

  static Component = ({ model }: SceneComponentProps<MultiValueVariable>) => {
    const { loading, value, options } = model.useState();

    const cascaderOptions = useMemo(
      () => buildServiceNameCascaderOptions(options.map(({ label }) => label)),
      [options]
    );

    function onSelect(newValue: any) {
      model.changeValueTo(newValue, newValue);
    }

    return (
      <Cascader
        // we do this to ensure that the Cascader selects the initial value properly
        key={String(loading)}
        aria-label="Services list"
        width={32}
        separator="/"
        displayAllSelectedLevels
        placeholder={loading ? 'Loading services...' : `Select a service (${options.length})`}
        options={cascaderOptions}
        initialValue={value as string}
        changeOnSelect={false}
        onSelect={onSelect}
      />
    );
  };
}
