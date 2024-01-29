import React from 'react';
import { Spinner, useStyles2 } from '@grafana/ui';
import { GrafanaTheme2 } from '@grafana/data';
import { css } from '@emotion/css';

const getStyles = (theme: GrafanaTheme2) => ({
  spinner: css`
    text-align: center;
    margin-top: ${theme.spacing(2)};
  `,
});

export function AdHocSpinner() {
  const styles = useStyles2(getStyles);

  return (
    <div className={styles.spinner}>
      <Spinner size={36} />
    </div>
  );
}
