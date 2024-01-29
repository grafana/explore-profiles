import { css } from '@emotion/css';
import { GrafanaTheme2, LoadingState } from '@grafana/data';
import { useStyles2 } from '@grafana/ui';
import { PanelProps } from 'grafana-pyroscope/public/app/components/Panel';
import React from 'react';

import { GrafanaPanelBox } from '../../shared/ui/GrafanaPanelBox/GrafanaPanelBox';

export function Panel({ isLoading, title, children, className = '', headerActions, dataTestId }: PanelProps) {
  const s = useStyles2(getStyles);

  const loadingState = isLoading ? LoadingState.Loading : LoadingState.Done;

  return (
    <div className={`${className} ${s.panelWrap}`} data-testid={dataTestId}>
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
