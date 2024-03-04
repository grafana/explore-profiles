import { css } from '@emotion/css';
import { IconName } from '@grafana/data';
import { Button, useStyles2 } from '@grafana/ui';
import React from 'react';

import { useFetchLlmPluginStatus } from '../infrastructure/useFetchLlmPluginStatus';

const getStyles = () => ({
  askAiButton: css`
    height: 24px;
    background-color: #8025ff;
    position: relative;
    top: 4px;
    &:not([disabled]):hover {
      background-color: #8025ff;
      opacity: 0.8;
    }
  `,
});

type ExplainFlameGraphButtonProps = {
  onClick: (event: React.MouseEvent<HTMLButtonElement>) => void;
  disabled?: boolean;
};

export function ExplainFlameGraphButton({ onClick, disabled }: ExplainFlameGraphButtonProps) {
  const styles = useStyles2(getStyles);
  const { isEnabled, error, isFetching } = useFetchLlmPluginStatus();

  let icon: IconName = 'fire';

  if (error) {
    icon = 'shield-exclamation';
  } else if (isFetching) {
    icon = 'fa fa-spinner';
  }

  return (
    <Button
      className={styles.askAiButton}
      onClick={onClick}
      disabled={!isEnabled || disabled}
      title={isEnabled ? 'Ask FlameGrot AI' : 'Grafana LLM plugin missing or not configured!'}
      icon={icon}
    >
      Explain FlameGraph
    </Button>
  );
}
