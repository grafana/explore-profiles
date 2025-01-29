import { css } from '@emotion/css';
import { IconName } from '@grafana/data';
import { Button, useStyles2 } from '@grafana/ui';
import { reportInteraction } from '@shared/domain/reportInteraction';
import React, { ReactNode } from 'react';

import { useFetchLlmPluginStatus } from './infrastructure/useFetchLlmPluginStatus';

type AIButtonProps = {
  children: ReactNode;
  onClick: (event: React.MouseEvent<HTMLButtonElement>) => void;
  disabled?: boolean;
  interactionName: 'g_pyroscope_app_explain_flamegraph_clicked' | 'g_pyroscope_app_optimize_code_clicked';
};

export function AIButton({ children, onClick, disabled, interactionName }: AIButtonProps) {
  const styles = useStyles2(getStyles);
  const { isEnabled, error, isFetching } = useFetchLlmPluginStatus();

  let icon: IconName = 'ai';
  let tooltip = '';

  if (isFetching) {
    icon = 'fa fa-spinner';
    tooltip = 'Checking the status of the Grafana LLM plugin...';
  } else if (error) {
    icon = 'exclamation-triangle';
    tooltip = 'Error while checking the status of the Grafana LLM plugin!';
  } else if (!isEnabled) {
    icon = 'shield-exclamation';
    tooltip = 'Grafana LLM plugin missing or not configured! Please check the plugins administration page.';
  }

  return (
    <Button
      className={styles.aiButton}
      size="md"
      fill="text"
      icon={icon}
      disabled={!isEnabled || disabled}
      tooltip={tooltip}
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
