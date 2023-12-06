import { css } from '@emotion/css';
import { GrafanaTheme2 } from '@grafana/data';
import { useStyles2 } from '@grafana/ui';
import React from 'react';

// eslint-disable-next-line no-unused-vars
const getStyles = (theme: GrafanaTheme2) => ({
  error: css`
    color: rgb(255, 136, 51);
    margin-bottom: 24px;
  `,
});

export function AiPanelError() {
  const styles = useStyles2(getStyles);

  return (
    <div className={styles.error}>
      Ooops! An unexpected error occurred while asking FlameGrot AI. Please try again later.
    </div>
  );
}
