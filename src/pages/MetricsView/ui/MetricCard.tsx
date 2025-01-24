import { css } from '@emotion/css';
import { GrafanaTheme2 } from '@grafana/data';
import { IconButton, InlineField, InlineFieldRow, Tag, TagList, useStyles2 } from '@grafana/ui';
import React from 'react';

type MetricCardProps = {
  name: string;
  profileType: string;
  exportedLabels: string[];
  filter: string;
};

export function MetricCard(props: MetricCardProps) {
  const styles = useStyles2(getStyles);
  const { name, profileType, exportedLabels, filter } = props;

  return (
    <div className={styles.card}>
      <div className={styles.row}>
        <h2 className={styles.heading}>{name}</h2>
      </div>

      <div className={styles.row}>
        <div>
          <InlineFieldRow>
            <InlineField label="Profile type" labelWidth={20}>
              <div>{profileType}</div>
            </InlineField>
          </InlineFieldRow>

          <InlineFieldRow>
            <InlineField label="Filter" labelWidth={20}>
              <div>{filter}</div>
            </InlineField>
          </InlineFieldRow>

          <InlineFieldRow>
            <InlineField label="Exported Labels" labelWidth={20}>
              {exportedLabels?.length > 0 ? <TagList tags={exportedLabels} /> : <Tag name="All" colorIndex={4} />}
            </InlineField>
          </InlineFieldRow>
        </div>

        <div>
          <IconButton
            name="trash-alt"
            variant="destructive"
            tooltip="Delete exported metric"
            size="lg"
            aria-label="Delete exported metric"
          />
        </div>
      </div>
    </div>
  );
}

const getStyles = (theme: GrafanaTheme2) => ({
  card: css`
    background: ${theme.colors.background.secondary};
    padding: ${theme.spacing(2)};
    width: 100%;
    display: flex;
    flex-direction: column;
  `,

  row: css`
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
  `,

  heading: css`
    font-size: ${theme.typography.h5.fontSize};
    font-weight: ${theme.typography.h5.fontWeight};
    word-break: break-word;

    overflow: hidden;
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;
  `,
});
