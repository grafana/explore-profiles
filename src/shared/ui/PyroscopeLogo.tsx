import { css, cx } from '@emotion/css';
import { useStyles2 } from '@grafana/ui';
import React from 'react';

type PyroscopeLogoProps = {
  size: 'small' | 'large';
};

function PyroscopeLogoComponent({ size }: PyroscopeLogoProps) {
  const styles = useStyles2(getStyles);
  return <img className={cx(styles.logo, size)} src="public/plugins/grafana-pyroscope-app/img/logo.svg" />;
}

export const PyroscopeLogo = React.memo(PyroscopeLogoComponent);

const getStyles = () => ({
  logo: css`
    &.small {
      width: 16px;
      height: 16px;
      margin-right: 4px;
      position: relative;
      top: -2px;
    }

    &.large {
      width: 40px;
      height: 40px;
    }
  `,
});
