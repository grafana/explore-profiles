import { css } from '@emotion/css';
import { GrafanaTheme2 } from '@grafana/data';
import { useStyles2 } from '@grafana/ui';
import { displayError } from '@shared/domain/displayStatus';
import { PageTitle } from '@shared/ui/PageTitle';
import React from 'react';

import { useCreatedMetricsView } from './domain/useCreatedMetricsView';
import { MetricCard } from './ui/MetricCard';

export function ExportedMetricsView() {
  const styles = useStyles2(getStyles);
  const { data } = useCreatedMetricsView();

  if (data.fetchError) {
    displayError(data.fetchError, [
      'Error while retrieving created metrics!',
      'Please try to reload the page, sorry for the inconvenience.',
    ]);
  }

  return (
    <>
      <PageTitle title="Created metrics" />

      <ul className={styles.list}>
        {data.metrics.map((metric: any, i: number) => (
          <li key={i}>
            <MetricCard
              key={i}
              name={metric.name}
              profileType={metric.profileType}
              exportedLabels={metric.exportedLabels}
              filter={metric.filter}
            />
          </li>
        ))}
      </ul>
    </>
  );
}

const getStyles = (theme: GrafanaTheme2) => ({
  list: css`
    width: 100%;
    display: flex;
    flex-direction: column;
    gap: ${theme.spacing(1)};
    list-style: none;
  `,
});
