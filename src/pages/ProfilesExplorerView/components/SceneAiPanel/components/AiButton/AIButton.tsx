import { css } from '@emotion/css';
import { IconName } from '@grafana/data';
import { Button, useStyles2 } from '@grafana/ui';
import { INTERACTION_NAME, reportInteraction } from '@shared/domain/reportInteraction';
import React, { ReactNode } from 'react';

import { useFetchLlmPluginStatus } from './infrastructure/useFetchLlmPluginStatus';

type AIButtonProps = {
  children: ReactNode;
  onClick: (event: React.MouseEvent<HTMLButtonElement>) => void;
  disabled?: boolean;
  interactionName: INTERACTION_NAME;
};

export function AIButton({ children, onClick, disabled, interactionName }: AIButtonProps) {
  const styles = useStyles2(getStyles);
  const { isEnabled, error, isFetching } = useFetchLlmPluginStatus();

  let icon: IconName = 'ai';
  let title = '';

  if (isFetching) {
    icon = 'fa fa-spinner';
    title = 'Checking the status of the Grafana LLM plugin...';
  } else if (!isEnabled || error) {
    icon = 'shield-exclamation';
    title = 'Grafana LLM plugin missing or not configured!';
  }

  return (
    <Button
      className={styles.aiButton}
      size="md"
      fill="text"
      icon={icon}
      disabled={!isEnabled || disabled}
      tooltip={title}
      tooltipPlacement="top"
      onClick={(event: React.MouseEvent<HTMLButtonElement>) => {
        reportInteraction(interactionName);
        onClick(event);
      }}
    >
      {children}
    </Button>
  );
}

const getStyles = () => ({
  aiButton: css`
    padding: 0 4px;
  `,
});
