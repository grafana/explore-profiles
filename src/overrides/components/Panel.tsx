import { GrafanaTheme2, LoadingState } from '@grafana/data';
import { useStyles2 } from '@grafana/ui';

import React from 'react';
import { GrafanaPanelBox } from '../../components/GrafanaPanelBox';
import { css } from '@emotion/css';
import { PanelProps } from 'grafana-pyroscope/public/app/components/Panel';

export function Panel({ isLoading, title, children, className = '', headerActions }: PanelProps) {
  const s = useStyles2(getStyles);

  const loadingState = isLoading ? LoadingState.Loading : LoadingState.Done;

  return (
    <div className={`${className} ${s.panelWrap}`}>
      <GrafanaPanelBox loadingState={loadingState} title={title as unknown as string} actions={headerActions}>
        {children}
      </GrafanaPanelBox>
    </div>
  );
}

const getStyles = (theme: GrafanaTheme2) => ({
  panelWrap: css`
    margin-bottom: ${theme.spacing(1)};
  `,
});
