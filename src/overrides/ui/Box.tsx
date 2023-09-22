import React, { useState } from 'react';
import { PanelContainer, useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';
import { GrafanaTheme2 } from '@grafana/data';

import { BoxProps, CollapseBoxProps } from 'grafana-pyroscope/public/app/ui/Box';

export default Box;
function Box(props: BoxProps) {
  const { children, className = '' } = props;

  const s = useStyles2(getStyles);

  return <PanelContainer className={`${className} ${s.box}`}>{children}</PanelContainer>;
}

export function CollapseBox({ title, children, isLoading }: CollapseBoxProps) {
  const [open, setOpen] = useState(true);

  const s = useStyles2(getStyles);

  return <PanelContainer title={title} className={s.box}>
    {children}
  </PanelContainer>
}

const getStyles = (theme: GrafanaTheme2) => ({
  box: css`
    margin-bottom: ${theme.spacing(1)};
    padding: ${theme.spacing(1)};
    position: relative;
  `,
});
