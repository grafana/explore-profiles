import React, { ReactNode } from 'react';
import { ChartTitleProps, getChartTitle } from 'grafana-pyroscope/public/app/components/ChartTitle';
import { Icon, useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';
import { GrafanaTheme2 } from '@grafana/data';

export default function ChartTitle({ children, color, icon, postfix, titleKey = 'unknown' }: ChartTitleProps) {
  const s = useStyles2(getStyles);

  const title = getChartTitle(titleKey);
  const iconComponent = color && (
    <span
      style={{
        color: color.rgb().toString(),
      }}
    >
      <Icon name="circle-mono" size="md" className={s.icon} />
    </span>
  );

  return (
    <>
      {iconComponent}
      {title}
      {children && <div style={{ background: 'magenta' }}>{children}</div>}
    </>
  );
}

const getStyles = (theme: GrafanaTheme2) => ({
  icon: css`
    padding-right: ${theme.spacing(0.5)};
    margin-bottom: ${theme.spacing(0.25)};
  `,
});
