import { css } from '@emotion/css';
import { IconName } from '@grafana/data';
import { Button, useStyles2 } from '@grafana/ui';
import { reportInteraction } from '@shared/domain/reportInteraction';
import React from 'react';

import { useFetchLlmPluginStatus } from '../infrastructure/useFetchLlmPluginStatus';

const getStyles = () => ({
  askAiButton: css`
    background-color: #8025ff;
    &:not([disabled]):hover {
      background-color: #6c27d3;
    }
    height: 24px;
    position: absolute;
    top: 8px;
    right: 8px;
    padding-left: 8px;
    padding-right: 8px;
  `,
});

type AIButtonProps = {
  onClick: (event: React.MouseEvent<HTMLButtonElement>) => void;
  disabled?: boolean;
  text: string;
  interactionName: string;
};

export function AIButton({ onClick, disabled, text, interactionName }: AIButtonProps) {
  const styles = useStyles2(getStyles);
  const { isEnabled, error, isFetching } = useFetchLlmPluginStatus();

  let icon: IconName = 'fire';

  if (error) {
    icon = 'shield-exclamation';
  } else if (isFetching) {
    icon = 'fa fa-spinner';
  }

  const onClickInternal = (event: React.MouseEvent<HTMLButtonElement>) => {
    reportInteraction(interactionName);
    onClick(event);
  };

  return (
    <Button
      className={styles.askAiButton}
      onClick={onClickInternal}
      disabled={!isEnabled || disabled}
      title={isEnabled ? 'Ask FlameGrot AI' : 'Grafana LLM plugin missing or not configured!'}
      icon={icon}
    >
      {text}
    </Button>
  );
}
