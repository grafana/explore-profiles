import { SelectableValue } from '@grafana/data';
import { MultiValueVariable, QueryVariable, SceneComponentProps, VariableDependencyConfig } from '@grafana/scenes';
import { Field, Spinner } from '@grafana/ui';
import React from 'react';
import { lastValueFrom } from 'rxjs';

import { PYROSCOPE_LABELS_DATA_SOURCE } from '../../data/pyroscope-data-sources';
import { GroupBySelector } from './GroupBySelector';

export class GroupByVariable extends QueryVariable {
  static DEFAULT_VALUE = 'all';

  protected _variableDependency = new VariableDependencyConfig(this, {
    variableNames: ['serviceName', 'profileMetricId'],
    onReferencedVariableValueChanged: this.update.bind(this),
  });

  static MAX_MAIN_GROUP_BY_LABELS = 8;

  constructor({ value }: { value?: string }) {
    // hack: the variable does not sync, if the "var-groupBy" search parameter is present in the URL, it is set to an empty value
    const initialValue =
      value || new URLSearchParams(window.location.search).get('var-groupBy') || GroupByVariable.DEFAULT_VALUE;

    super({
      name: 'groupBy',
      label: 'Group by',
      datasource: PYROSCOPE_LABELS_DATA_SOURCE,
      query: 'list', // dummy query, can't be an empty string
      loading: true,
      value: initialValue,
    });

    this.addActivationHandler(() => {
      // hack
      const refreshButton = document.querySelector(
        '[data-testid="data-testid RefreshPicker run button"]'
      ) as HTMLButtonElement;

      if (!refreshButton) {
        console.error('GroupByVariable: Refresh button not found! The list of labels will never be updated.');
      }

      const onClickRefresh = () => {
        this.update();
      };

      refreshButton?.addEventListener('click', onClickRefresh);

      return () => {
        refreshButton?.removeEventListener('click', onClickRefresh);
      };
    });
  }

  async update() {
    this.setState({ loading: true });

    const options = await lastValueFrom(this.getValueOptions({}));

    this.setState({ loading: false, options });

    const value = options.some(({ value }) => value === this.state.value)
      ? this.state.value
      : GroupByVariable.DEFAULT_VALUE;

    this.changeValueTo(value, value);
  }

  static Component = ({ model }: SceneComponentProps<MultiValueVariable>) => {
    // TODO: handle error
    const { loading, value, options } = model.useState();
    const groupByOptions = options as Array<SelectableValue<string>>;

    const getMainLabels = (groupByOptions: Array<SelectableValue<string>>) => {
      return groupByOptions.slice(0, GroupByVariable.MAX_MAIN_GROUP_BY_LABELS).map(({ value }) => value as string);
    };

    function onSelect(newValue: any) {
      model.changeValueTo(newValue, newValue);
    }

    return loading ? (
      <Field label="Group by">
        <Spinner />
      </Field>
    ) : (
      <GroupBySelector
        options={groupByOptions}
        value={value as string}
        mainLabels={getMainLabels(groupByOptions)}
        onChange={onSelect}
      />
    );
  };
}
