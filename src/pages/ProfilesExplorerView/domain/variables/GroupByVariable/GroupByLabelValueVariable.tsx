import { css } from '@emotion/css';
import { GrafanaTheme2, VariableRefresh } from '@grafana/data';
import { MultiValueVariable, QueryVariable, SceneComponentProps, VariableValueOption } from '@grafana/scenes';
import { Cascader, Icon, Tooltip, useStyles2 } from '@grafana/ui';
import { prepareHistoryEntry } from '@shared/domain/prepareHistoryEntry';
import { reportInteraction } from '@shared/domain/reportInteraction';
import { userStorage } from '@shared/infrastructure/userStorage';
import { nanoid } from 'nanoid';
import React, { useMemo } from 'react';
import { lastValueFrom } from 'rxjs';

import { PYROSCOPE_GROUP_BY_LABEL_DATA_SOURCE } from '../../../infrastructure/pyroscope-data-sources';
import { buildServiceNameCascaderOptions } from '../ServiceNameVariable/domain/useBuildServiceNameOptions';

export type GroupByLabelValueVariableState = {
  labelName: string;
  hierarchyLevel: number;
  query?: string;
  skipUrlSync?: boolean;
};

export class GroupByLabelValueVariable extends QueryVariable {
  private labelName: string;
  private hierarchyLevel: number;

  constructor(state: GroupByLabelValueVariableState) {
    const { labelName, hierarchyLevel, skipUrlSync } = state;

    super({
      key: `groupByLabelValue-${hierarchyLevel}`,
      name: `groupByLabelValue${hierarchyLevel}`,
      label: labelName,
      datasource: PYROSCOPE_GROUP_BY_LABEL_DATA_SOURCE,
      query: `$dataSource labelValues ${labelName} level ${hierarchyLevel}`,
      loading: true,
      refresh: VariableRefresh.onTimeRangeChanged,
      skipUrlSync,
    });

    this.labelName = labelName;
    this.hierarchyLevel = hierarchyLevel;
    this.addActivationHandler(this.onActivate.bind(this));
  }

  onActivate() {
    this.setInitialValue();

    this.subscribeToState((newState, prevState) => {
      if (newState.value && newState.value !== prevState.value) {
        const storage = userStorage.get(userStorage.KEYS.PROFILES_EXPLORER) || {};
        if (!storage.groupByLabelValues) {
          storage.groupByLabelValues = {};
        }
        storage.groupByLabelValues[this.labelName] = newState.value;
        userStorage.set(userStorage.KEYS.PROFILES_EXPLORER, storage);
      }
    });
  }

  setInitialValue() {
    const storage = userStorage.get(userStorage.KEYS.PROFILES_EXPLORER) || {};
    const valueFromStorage = storage.groupByLabelValues?.[this.labelName];

    if (valueFromStorage && !this.state.value) {
      this.setState({ value: valueFromStorage });
    }
  }

  async update() {
    if (this.state.loading) {
      return;
    }

    let options: VariableValueOption[] = [];
    let error = null;

    this.setState({ loading: true, options: [], error: null });

    try {
      options = await lastValueFrom(this.getValueOptions({}));
    } catch (e) {
      error = e;
    } finally {
      this.setState({ loading: false, options, error });
    }
  }

  selectNewValue = (newValue: string) => {
    reportInteraction('g_pyroscope_app_group_by_label_value_selected', {
      labelName: this.labelName,
      hierarchyLevel: this.hierarchyLevel,
    });

    if (!this.state.skipUrlSync) {
      prepareHistoryEntry();
    }

    this.changeValueTo(newValue);
  };

  getLabelName() {
    return this.labelName;
  }

  getHierarchyLevel() {
    return this.hierarchyLevel;
  }

  static Component = ({ model }: SceneComponentProps<MultiValueVariable & { selectNewValue?: any }>) => {
    const styles = useStyles2(getStyles);
    const { loading, value, options, error, label } = model.useState();

    const cascaderOptions = useMemo(
      () => buildServiceNameCascaderOptions(options.map(({ label }) => label)),
      [options]
    );

    if (error) {
      return (
        <Tooltip theme="error" content={error.toString()}>
          <Icon className={styles.iconError} name="exclamation-triangle" size="xl" />
        </Tooltip>
      );
    }

    return (
      <Cascader
        key={nanoid(5)}
        aria-label={`${label} list`}
        width={32}
        separator="/"
        displayAllSelectedLevels
        placeholder={loading ? `Loading ${label}...` : `Select ${label} (${options.length})`}
        options={cascaderOptions}
        initialValue={value as string}
        changeOnSelect={false}
        onSelect={model.selectNewValue}
      />
    );
  };
}

const getStyles = (theme: GrafanaTheme2) => ({
  iconError: css`
    height: 32px;
    align-self: center;
    color: ${theme.colors.error.text};
  `,
});
