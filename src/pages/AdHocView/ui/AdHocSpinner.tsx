import { css } from '@emotion/css';
import { GrafanaTheme2 } from '@grafana/data';
import { Spinner, useStyles2 } from '@grafana/ui';
import React from 'react';

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
