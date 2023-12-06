import { css } from '@emotion/css';
import { GrafanaTheme2 } from '@grafana/data';
import { Button, useStyles2 } from '@grafana/ui';
import React from 'react';

type AiPanelHeaderProps = {
  onClickClose: (event: any) => void;
};

// eslint-disable-next-line no-unused-vars
const getStyles = (theme: GrafanaTheme2) => ({
  header: css`
    display: flex;
    justify-content: space-between;
  `,
});

export function AiPanelHeader({ onClickClose }: AiPanelHeaderProps) {
  const styles = useStyles2(getStyles);

  return (
    <div className={styles.header}>
      <h1>AI Flamegraph Analysis</h1>

      <Button
        fill="text"
        icon="x"
        variant="secondary"
        tooltip="Close AI panel"
        tooltipPlacement="top"
        onClick={onClickClose}
      />
    </div>
  );
}
