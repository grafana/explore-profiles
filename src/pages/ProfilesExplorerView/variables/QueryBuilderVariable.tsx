import { css } from '@emotion/css';
import { CustomVariable, MultiValueVariable, SceneComponentProps, sceneGraph } from '@grafana/scenes';
import { useStyles2 } from '@grafana/ui';
import { QueryBuilder } from '@shared/components/QueryBuilder/QueryBuilder';
import React, { useCallback, useEffect } from 'react';

import { ProfileMetricVariable } from './ProfileMetricVariable';
import { ServiceNameVariable } from './ServiceNameVariable';

export class QueryBuilderVariable extends CustomVariable {
  constructor({ value }: { value?: string }) {
    // hack: the variable does not sync, if the "var-profileMetricId" search parameter is present in the URL, it is set to an empty value
    const initialValue = value || new URLSearchParams(window.location.search).get('var-filters') || '';

    super({
      name: 'filters',
      label: 'Filters',
      isMulti: false,
    });

    this.addActivationHandler(() => {
      this.setState({ value: initialValue });

      (sceneGraph.findObject(this, (o) => o instanceof ServiceNameVariable) as ServiceNameVariable).subscribeToState(
        () => {
          this.setState({ value: '' });
        }
      );
    });
  }

  static Component = ({ model }: SceneComponentProps<MultiValueVariable>) => {
    const styles = useStyles2(getStyles); // eslint-disable-line react-hooks/rules-of-hooks

    const { value } = model.useState();
    const { from, to } = sceneGraph.getTimeRange(model).state.value;

    useEffect(() => {
      if (value) {
        return;
      }

      const serviceName = (
        sceneGraph.findObject(model, (o) => o instanceof ServiceNameVariable) as ServiceNameVariable
      )?.getValue() as string;

      const profileMetricId = (
        sceneGraph.findObject(model, (o) => o instanceof ProfileMetricVariable) as ProfileMetricVariable
      )?.getValue() as string;

      const newValue = `${profileMetricId}{service_name="${serviceName}"}`;

      model.changeValueTo(newValue, newValue);
    }, [model, value]);

    const onChangeQuery = useCallback(
      (newQuery: string) => {
        model.setState({ value: newQuery });
      },
      [model]
    );

    return (
      <div className={styles.queryBuilderContainer}>
        <QueryBuilder
          id="query-builder-explore"
          query={value as string}
          from={from.unix() * 1000}
          until={to.unix() * 1000}
          onChangeQuery={onChangeQuery}
        />
      </div>
    );
  };
}

const getStyles = () => ({
  queryBuilderContainer: css`
    flex: 1;
    min-width: 0;
  `,
});
