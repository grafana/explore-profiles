import { css } from '@emotion/css';
import { GrafanaTheme2 } from '@grafana/data';
import {
  MultiValueVariable,
  QueryVariable,
  SceneComponentProps,
  sceneGraph,
  VariableValueOption,
} from '@grafana/scenes';
import { Cascader, Icon, Tooltip, useStyles2 } from '@grafana/ui';
import { buildServiceNameCascaderOptions } from '@shared/components/Toolbar/domain/useBuildServiceNameOptions';
import React, { useMemo } from 'react';
import { lastValueFrom } from 'rxjs';

import { PYROSCOPE_SERIES_DATA_SOURCE } from '../data/pyroscope-data-sources';
import { findSceneObjectByClass } from '../helpers/findSceneObjectByClass';
import { FiltersVariable } from './FiltersVariable/FiltersVariable';
import { ProfilesDataSourceVariable } from './ProfilesDataSourceVariable';

export class ServiceNameVariable extends QueryVariable {
  constructor() {
    super({
      name: 'serviceName',
      label: '🚀 Service',
      datasource: PYROSCOPE_SERIES_DATA_SOURCE,
      query: 'serviceName',
      loading: true,
    });

    this.addActivationHandler(this.onActivate.bind(this));
  }

  onActivate() {
    if (!this.state.value) {
      this.setState({ value: this.state.options[0].value });
    }

    const sub = sceneGraph.getTimeRange(this).subscribeToState(() => this.update(false));

    // VariableDependencyConfig does not work :man_shrug: (never called)
    const dataSourceSub = (
      findSceneObjectByClass(this, ProfilesDataSourceVariable) as ProfilesDataSourceVariable
    ).subscribeToState(() => this.update(true));

    return () => {
      dataSourceSub.unsubscribe();
      sub.unsubscribe();
    };
  }

  async update(selectDefaultValue = false) {
    let options: VariableValueOption[] = [];
    let error = null;

    this.changeValueTo('', '');

    this.setState({ loading: true });

    try {
      options = await lastValueFrom(this.getValueOptions({}));
    } catch (e) {
      error = e;
    } finally {
      this.setState({ loading: false, options, error });

      if (selectDefaultValue) {
        this.selectNewValue(options[0].value as string);
      }
    }
  }

  selectNewValue = (newValue: string) => {
    this.changeValueTo(newValue, newValue);

    // manually reset filters - the "Scenes way" would be to listen to the variable changes but it leads to errors
    // see comments in src/pages/ProfilesExplorerView/variables/FiltersVariable/FiltersVariable.tsx
    const filtersVariable = findSceneObjectByClass(this, FiltersVariable) as FiltersVariable;
    filtersVariable.setState({ filters: [] });
  };

  static Component = ({ model }: SceneComponentProps<MultiValueVariable & { selectNewValue?: any }>) => {
    const styles = useStyles2(getStyles);
    const { loading, value, options, error } = model.useState();

    const cascaderOptions = useMemo(
      () => buildServiceNameCascaderOptions(options.map(({ label }) => label)),
      [options]
    );

    if (error) {
      console.error('Error while loading "serviceName" variable values!');
      console.error(error);

      return (
        <Tooltip theme="error" content={error.toString()}>
          <Icon className={styles.iconError} name="exclamation-triangle" size="xl" />
        </Tooltip>
      );
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
        onSelect={model.selectNewValue}
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
