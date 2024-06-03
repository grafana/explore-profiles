import { css } from '@emotion/css';
import { GrafanaTheme2, LoadingState } from '@grafana/data';
import { useStyles2 } from '@grafana/ui';
import React, { ReactNode } from 'react';

import { GrafanaPanelBox } from './GrafanaPanelBox/GrafanaPanelBox';

const getStyles = (theme: GrafanaTheme2) => ({
  panelWrap: css`
    margin-bottom: ${theme.spacing(1)};
  `,
});

type PanelProps = {
  isLoading: boolean;
  title?: ReactNode;
  description?: ReactNode;
  children: ReactNode;
  className?: string;
  headerActions?: ReactNode;
  dataTestId?: string;
};

export function Panel({
  isLoading,
  title,
  description,
  children,
  className = '',
  headerActions,
  dataTestId,
}: PanelProps) {
  const s = useStyles2(getStyles);

  const loadingState = isLoading ? LoadingState.Loading : LoadingState.Done;

  return (
    <div className={`${className} ${s.panelWrap}`} data-testid={dataTestId || 'panel'}>
      <GrafanaPanelBox
        loadingState={loadingState}
        title={title as unknown as string}
        description={description as unknown as string}
        actions={headerActions}
      >
        {children}
      </GrafanaPanelBox>
    </div>
  );
}
