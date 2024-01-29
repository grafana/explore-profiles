import { css } from '@emotion/css';
import { GrafanaTheme2 } from '@grafana/data';
import { useStyles2 } from '@grafana/ui';
import React from 'react';

const getStyles = (theme: GrafanaTheme2) => ({
  container: css`
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: ${theme.spacing(1)};
    width: 100%;
  `,
  column: css`
    width: 50%;
  `,
});

type AdHocColumnsProps = {
  left: React.ReactNode;
  right: React.ReactNode;
};

export function AdHocColumns({ left, right }: AdHocColumnsProps) {
  const styles = useStyles2(getStyles);

  return (
    <div className={styles.container}>
      <div className={styles.column}>{left}</div>
      <div className={styles.column}>{right}</div>
    </div>
  );
}
