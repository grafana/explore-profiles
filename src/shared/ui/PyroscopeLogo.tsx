import { css } from '@emotion/css';
import { useStyles2 } from '@grafana/ui';
import React from 'react';

type PyroscopeLogoProps = {
  width: number;
  height: number;
};

export function PyroscopeLogo({ width, height }: PyroscopeLogoProps) {
  const styles = useStyles2(getStyles);
  return (
    <img style={{ width, height }} className={styles.logo} src="public/plugins/grafana-pyroscope-app/img/logo.svg" />
  );
}

const getStyles = () => ({
  logo: css`
    margin-right: 4px;
  `,
});
