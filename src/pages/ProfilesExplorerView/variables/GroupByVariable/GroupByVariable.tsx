import { css } from '@emotion/css';
import { GrafanaTheme2, SelectableValue } from '@grafana/data';
import {
  MultiValueVariable,
  QueryVariable,
  SceneComponentProps,
  VariableDependencyConfig,
  VariableValueOption,
} from '@grafana/scenes';
import { Field, Icon, Spinner, Tooltip, useStyles2 } from '@grafana/ui';
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

  static MAX_MAIN_LABELS = 8;

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
    let options: VariableValueOption[] = [];
    let error = null;

    this.setState({ loading: true });

    try {
      options = await lastValueFrom(this.getValueOptions({}));
    } catch (e) {
      error = e;
    } finally {
      this.setState({ loading: false, options, error });
    }

    const value = options.some(({ value }) => value === this.state.value)
      ? this.state.value
      : GroupByVariable.DEFAULT_VALUE;

    this.changeValueTo(value, value);
  }

  static Component = ({ model }: SceneComponentProps<MultiValueVariable>) => {
    const styles = useStyles2(getStyles);
    const { loading, value, options, error } = model.useState();

    if (loading) {
      return (
        <Field label="Group by">
          <Spinner />
        </Field>
      );
    }

    if (error) {
      console.error('Error while loading "groupBy" variable values!');
      console.error(error);

      return (
        <Field label="Group by">
          <Tooltip theme="error" content={error.toString()}>
            <Icon className={styles.iconError} name="exclamation-triangle" size="xl" />
          </Tooltip>
        </Field>
      );
    }

    const groupByOptions = options as Array<SelectableValue<string>>;

    const getMainLabels = (groupByOptions: Array<SelectableValue<string>>) => {
      return groupByOptions.slice(0, GroupByVariable.MAX_MAIN_LABELS).map(({ value }) => value as string);
    };

    return loading ? (
      <Field label="Group by">
        <Spinner />
      </Field>
    ) : (
      <GroupBySelector
        options={groupByOptions}
        value={value as string}
        mainLabels={getMainLabels(groupByOptions)}
        onChange={(newValue: string) => model.changeValueTo(newValue, newValue)}
      />
    );
  };
}

const getStyles = (theme: GrafanaTheme2) => ({
  iconError: css`
    color: ${theme.colors.error.text};
    align-self: center;
  `,
});
