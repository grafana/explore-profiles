import { css } from '@emotion/css';
import { GrafanaTheme2 } from '@grafana/data';
import { IconButton, Stack, TagList, useStyles2 } from '@grafana/ui';
import { displayError } from '@shared/domain/displayStatus';
import { PageTitle } from '@shared/ui/PageTitle';
import React from 'react';

import { useCreatedMetricsView } from './domain/useCreatedMetricsView';

export function MetricsView() {
  const styles = useStyles2(getStyles);
  const { data } = useCreatedMetricsView();
  const { metrics } = data;

  if (data.fetchError) {
    displayError(data.fetchError, [
      'Error while retrieving created metrics!',
      'Please try to reload the page, sorry for the inconvenience.',
    ]);
  }

  const renderQuery = (query: string) => {
    const matchers = query
      .replace(/^\{(.*)\}$/, '$1')
      .split(',')
      .map((matcher) => {
        const matches = matcher.trim().match(/^(\S+)\s*(=|!=|=~|!~)\s*"(\S+)"$/);
        if (!matches) {
          return null;
        }

        const [, key, op, value] = matches;
        return `${key} ${op} ${value}`;
      })
      .filter((matcher) => matcher !== null);

    if (matchers.length === 0) {
      return <></>;
    }
    return (
      <TagList
        className={styles.colLabelsTags}
        getColorIndex={() => 9} // A hack to find a nice gray color.
        tags={matchers}
      />
    );
  };

  return (
    <>
      <PageTitle title="Created metrics" />

      <Stack direction="column">
        <div className={styles.headerRow}>
          <Stack direction="row" gap={2}>
            <div className={styles.colName}>Name</div>
            <div className={styles.colProfileType}>Profile type</div>
            <div className={styles.colLabels}>Labels</div>
            <div className={styles.colQuery}>Query matchers</div>
            <div className={styles.colDataSource}>Data source</div>
            <div className={styles.colActions}>Actions</div>
          </Stack>
        </div>

        {metrics.map((metric, i) => (
          <div className={i % 2 === 0 ? styles.accentRow : styles.row} key={i}>
            <Stack direction="row" key={i} gap={2}>
              <div className={styles.colName}>{metric.name}</div>
              <div className={styles.colProfileType}>{metric.profileType}</div>
              <TagList className={styles.colLabelsTags} tags={metric.labels.length > 0 ? metric.labels : ['All']} />
              <div className={styles.colQuery}>{renderQuery(metric.filter)}</div>
              <div className={styles.colDataSource}>{metric.dataSource}</div>
              <div className={styles.colActions}>
                <IconButton name="trash-alt" variant="destructive" tooltip="Delete metric" onClick={() => {}} />
              </div>
            </Stack>
          </div>
        ))}
      </Stack>
    </>
  );
}

const getStyles = (theme: GrafanaTheme2) => {
  const row = css`
    padding: ${theme.spacing(1)};
  `;

  const col = css`
    align-self: center;
  `;

  return {
    row,
    headerRow: css`
      ${row};
      background-color: ${theme.colors.background.secondary};
      font-weight: ${theme.typography.fontWeightBold};
      font-size: ${theme.typography.h5.fontSize};
    `,
    accentRow: css`
      ${row};
      background-color: ${theme.colors.background.primary};
    `,
    colName: css`
      ${col};
      flex: 0 0 20%;
    `,
    colProfileType: css`
      ${col};
      flex: 0 0 10%;
    `,
    colLabels: css`
      ${col};
      flex: 0 0 25%;
    `,
    colLabelsTags: css`
      ${col};
      flex: 0 0 25%;
      justify-content: flex-start;
      align-items: start;
    `,
    colQuery: css`
      ${col};
      flex: 0 0 25%;
    `,
    colDataSource: css`
      ${col};
      flex: 0 0 10%;
    `,
    colActions: css`
      ${col};
      flex: 0 0 auto;
      align-self: center;
      margin-left: auto;
    `,
    matcherBox: css`
      font-family: ${theme.typography.fontFamilyMonospace};
      font-size: ${theme.typography.bodySmall.fontSize};
      border: 1px solid ${theme.colors.border.strong};
      border-radius: ${theme.spacing(0.5)};
      padding: ${theme.spacing(0.5)};
      background-color: ${theme.colors.background.secondary};
    `,
  };
};
