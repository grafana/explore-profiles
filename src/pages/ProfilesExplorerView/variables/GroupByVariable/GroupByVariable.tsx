import { css } from '@emotion/css';
import { GrafanaTheme2, SelectableValue } from '@grafana/data';
import {
  MultiValueVariable,
  QueryVariable,
  SceneComponentProps,
  sceneGraph,
  VariableDependencyConfig,
  VariableValueOption,
} from '@grafana/scenes';
import { Field, Icon, RefreshPicker, Spinner, Tooltip, useStyles2 } from '@grafana/ui';
import { noOp } from '@shared/domain/noOp';
import React from 'react';
import { lastValueFrom } from 'rxjs';

import { PYROSCOPE_LABELS_DATA_SOURCE } from '../../data/pyroscope-data-sources';
import { findSceneObjectByClass } from '../../helpers/findSceneObjectByClass';
import { GroupBySelector } from './GroupBySelector';

export class GroupByVariable extends QueryVariable {
  static DEFAULT_VALUE = 'all';

  protected _variableDependency = new VariableDependencyConfig(this, {
    variableNames: ['serviceName', 'profileMetricId'],
    onReferencedVariableValueChanged: () => {
      const notReady = sceneGraph.hasVariableDependencyInLoadingState(this);
      if (notReady) {
        return;
      }

      this.update();
    },
  });

  static MAX_MAIN_LABELS = 8;

  constructor() {
    super({
      name: 'groupBy',
      label: 'Group by',
      datasource: PYROSCOPE_LABELS_DATA_SOURCE,
      query: 'list', // dummy query, can't be an empty string
      loading: true,
    });

    this.addActivationHandler(this.onActivate.bind(this));
  }

  onActivate() {
    if (!this.state.value) {
      this.setState({ value: GroupByVariable.DEFAULT_VALUE });
    }

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
  }

  static Component = ({ model }: SceneComponentProps<MultiValueVariable>) => {
    const styles = useStyles2(getStyles);
    const { loading, value, options, error } = model.useState();

    const onRefresh = () => {
      (findSceneObjectByClass(model, GroupByVariable) as GroupByVariable).update();
    };

    if (loading) {
      return (
        <Field label="Group by">
          <Spinner className={styles.spinner} />
        </Field>
      );
    }

    if (error) {
      console.error('Error while loading "groupBy" variable values!');
      console.error(error);

      return (
        <>
          <Field label="Group by">
            <div className={styles.groupByErrorContainer}>
              <Tooltip theme="error" content={error.toString()}>
                <Icon className={styles.iconError} name="exclamation-triangle" size="xl" />
              </Tooltip>
              <RefreshPicker noIntervalPicker onRefresh={onRefresh} isOnCanvas={false} onIntervalChanged={noOp} />
            </div>
          </Field>
        </>
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
        onRefresh={onRefresh}
      />
    );
  };
}

const getStyles = (theme: GrafanaTheme2) => ({
  spinner: css`
    height: 32px;
    line-height: 32px;
  `,
  groupByErrorContainer: css`
    display: flex;
  `,
  iconError: css`
    color: ${theme.colors.error.text};
    align-self: center;
  `,
});
