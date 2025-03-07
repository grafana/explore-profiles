import { css } from '@emotion/css';
import { GrafanaTheme2 } from '@grafana/data';
import { Tag, useStyles2 } from '@grafana/ui';
import React from 'react';

export type ReadonlyFilter = {
  id: string;
  attribute: string;
  operator: string;
  value: string;
};

type ReadonlyChicletListProps = {
  filters: ReadonlyFilter[];
};

export const ReadonlyChicletList = ({ filters }: ReadonlyChicletListProps) => {
  const styles = useStyles2(getStyles);

  return (
    <div className={styles.chicletsList}>
      {filters.map((filter) => (
        <div key={filter.id}>
          <ReadonlyChiclet attribute={filter.attribute} operator={filter.operator} value={filter.value} />
        </div>
      ))}
    </div>
  );
};

type ReadonlyChicletProps = {
  attribute: string;
  operator: string;
  value: string;
};

const ReadonlyChiclet = ({ attribute, operator, value }: ReadonlyChicletProps) => {
  const styles = useStyles2(getStyles);

  // TODO: Figure out how to get this to mirror the existing chiclet styling.
  return (
    <div className={styles.chiclet}>
      <Tag name={attribute} />
      <Tag name={operator} />
      <Tag className={styles.chicletValue} name={value} />
    </div>
  );
};

const textColor = '#fff';
const activeColor = 'rgb(61, 113, 217)';

const getStyles = (theme: GrafanaTheme2) => ({
  chicletsList: css`
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 4px;
    max-width: 100%;
  `,

  chiclet: css`
    display: flex;
    align-items: center;
    border: 1px solid ${activeColor};
    border-radius: 2px;

    & > * {
      background-color: ${theme.colors.background.primary} !important;
    }

    & > :first-child {
      background-color: ${activeColor} !important;
      color: ${textColor};
      border-radius: 0;
    }

    & > :last-child {
      border-left: 1px solid ${activeColor};
      border-top-left-radius: 0;
      border-bottom-left-radius: 0;
    }
  `,

  chicletValue: css`
    flex-grow: 1;
    text-align: left;
    max-width: 420px;
    text-overflow: ellipsis;
    text-wrap: nowrap;
    overflow: hidden;
  `,
});
