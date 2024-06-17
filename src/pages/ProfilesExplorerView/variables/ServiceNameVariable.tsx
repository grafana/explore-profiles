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
import { buildQuery, parseQuery } from '@shared/domain/url-params/parseQuery';
import { useQueryFromUrl } from '@shared/domain/url-params/useQueryFromUrl';
import React, { useEffect, useMemo } from 'react';
import { lastValueFrom } from 'rxjs';

import { PYROSCOPE_SERVICES_DATA_SOURCE } from '../data/pyroscope-data-sources';
import { findSceneObjectByClass } from '../helpers/findSceneObjectByClass';
import { FiltersVariable } from './FiltersVariable/FiltersVariable';

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
      value: initialValue,
    });

    this.addActivationHandler(this.onActivate.bind(this));
  }

  onActivate() {
    const sub = sceneGraph.getTimeRange(this).subscribeToState(async () => {
      this.update();
    });

    return () => {
      sub.unsubscribe();
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

    // empty string to show the user the previous value is not available anymore
    const value = options.some(({ value }) => value === this.state.value) ? this.state.value : '';

    this.changeValueTo(value, value);
  }

  static Component = ({ model }: SceneComponentProps<MultiValueVariable>) => {
    const styles = useStyles2(getStyles);
    const { loading, value, options, error } = model.useState();
    const [query, setQuery] = useQueryFromUrl();

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

    const onSelect = (newValue: string) => {
      model.changeValueTo(newValue, newValue);

      // manually reset filters - the "Scenes way" would be to listen to the variable changes but it leads to errors
      // see comments in src/pages/ProfilesExplorerView/variables/FiltersVariable/FiltersVariable.tsx
      const filtersVariable = findSceneObjectByClass(model, FiltersVariable) as FiltersVariable;
      filtersVariable.setState({ filters: [] });
    };

    useEffect(() => {
      if (typeof value === 'string') {
        // Explain Flame Graph (AI button) depends on the query value so we have to sync it here
        const { profileMetricId, labels } = parseQuery(query);
        setQuery(buildQuery({ serviceId: value, profileMetricId, labels }));
      }
    }, [query, setQuery, value]);

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

const getStyles = (theme: GrafanaTheme2) => ({
  iconError: css`
    color: ${theme.colors.error.text};
    align-self: center;
  `,
});
