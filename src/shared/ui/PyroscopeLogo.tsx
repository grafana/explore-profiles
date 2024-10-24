import { css } from '@emotion/css';
import { useStyles2 } from '@grafana/ui';
import React from 'react';

type PyroscopeLogoProps = {
  width: number;
  height: number;
  style?: Record<string, any>;
};

function PyroscopeLogoComponent({ width, height, style }: PyroscopeLogoProps) {
  const styles = useStyles2(getStyles);
  return (
    <img
      style={{ width, height, ...style }}
      className={styles.logo}
      src="public/plugins/grafana-pyroscope-app/img/logo.svg"
    />
  );
}

export const PyroscopeLogo = React.memo(PyroscopeLogoComponent);

const getStyles = () => ({
  logo: css`
    margin-right: 4px;
  `,
});
