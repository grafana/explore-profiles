import { css } from '@emotion/css';
import { GrafanaTheme2, SelectableValue } from '@grafana/data';
import { MultiValueVariable, QueryVariable, SceneComponentProps, VariableValueOption } from '@grafana/scenes';
import { Field, Icon, RefreshPicker, Spinner, Tooltip, useStyles2 } from '@grafana/ui';
import { noOp } from '@shared/domain/noOp';
import { prepareHistoryEntry } from '@shared/domain/prepareHistoryEntry';
import { reportInteraction } from '@shared/domain/reportInteraction';
import React, { useMemo } from 'react';
import { lastValueFrom } from 'rxjs';
import { GridItemData } from 'src/pages/ProfilesExplorerView/components/SceneByVariableRepeaterGrid/types/GridItemData';

import { PYROSCOPE_LABELS_DATA_SOURCE } from '../../../infrastructure/pyroscope-data-sources';
import { GroupBySelector } from './GroupBySelector';

export type OptionWithIndex = VariableValueOption & {
  index: number;
  value: string;
  label: string;
  groupBy: GridItemData['queryRunnerParams']['groupBy'];
};

export class GroupByVariable extends QueryVariable {
  static DEFAULT_VALUE = 'all';

  static MAX_MAIN_LABELS = 8;

  constructor() {
    super({
      key: 'groupBy',
      name: 'groupBy',
      label: 'Group by labels',
      datasource: PYROSCOPE_LABELS_DATA_SOURCE,
      // "hack": we want to subscribe to changes of dataSource, serviceName and profileMetricId
      // we could also add filters, but the Service labels exploration type would reload all labels each time they are modified
      // which wouldn't be great UX
      query: '$dataSource and $profileMetricId{service_name="$serviceName"}',
      loading: true,
    });

    this.changeValueTo = this.changeValueTo.bind(this);

    this.addActivationHandler(this.onActivate.bind(this));
  }

  onActivate() {
    if (!this.state.value) {
      this.setState({ value: GroupByVariable.DEFAULT_VALUE });
    }
  }

  update = async () => {
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
  };

  onChange = (newValue: string) => {
    reportInteraction('g_pyroscope_app_group_by_label_clicked');

    prepareHistoryEntry();
    this.changeValueTo(newValue);
  };

  findCurrentOption(): OptionWithIndex {
    const { value } = this.state;

    // See LabelsDataSource.ts
    const option = this.state.options
      .filter((o) => o.value !== 'all')
      .find((o) => JSON.parse(o.value as string).value === value);

    if (option) {
      const parsedValue = JSON.parse(option.value as string);
      return {
        index: parsedValue.index,
        value: parsedValue.value,
        label: parsedValue.value,
        groupBy: parsedValue.groupBy,
      };
    }

    return {
      index: 0,
      value: value as string,
      label: value as string,
      groupBy: undefined,
    };
  }

  static Component = ({ model }: SceneComponentProps<MultiValueVariable & { update?: any; onChange?: any }>) => {
    const styles = useStyles2(getStyles);
    const { loading, value, options, error } = model.useState();

    const groupByOptions = useMemo(
      () =>
        options.map(({ label, value }) => {
          return value === 'all'
            ? { label, value }
            : {
                label,
                // see src/pages/ProfilesExplorerView/data/labels/LabelsDataSource.ts
                value: JSON.parse(String(value)).value,
              };
        }),
      [options]
    );

    if (loading) {
      return (
        <Field label="Group by labels">
          <Spinner className={styles.spinner} />
        </Field>
      );
    }

    if (error) {
      return (
        <Field label="Group by labels">
          <div className={styles.groupByErrorContainer}>
            <Tooltip theme="error" content={error.toString()}>
              <Icon className={styles.iconError} name="exclamation-triangle" size="xl" />
            </Tooltip>
            <RefreshPicker noIntervalPicker onRefresh={model.update} isOnCanvas={false} onIntervalChanged={noOp} />
          </div>
        </Field>
      );
    }

    const getMainLabels = (groupByOptions: Array<SelectableValue<string>>) => {
      return groupByOptions.slice(0, GroupByVariable.MAX_MAIN_LABELS).map(({ value }) => value as string);
    };

    return (
      <GroupBySelector
        options={groupByOptions}
        value={value as string}
        mainLabels={getMainLabels(groupByOptions)}
        onChange={model.onChange}
        onRefresh={model.update}
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
    height: 32px;
    align-self: center;
    color: ${theme.colors.error.text};
  `,
});
