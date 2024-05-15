import { IconName } from '@grafana/data';
import { Button } from '@grafana/ui';
import { reportInteraction } from '@shared/domain/reportInteraction';
import React, { ReactNode } from 'react';

import { useFetchLlmPluginStatus } from '../infrastructure/useFetchLlmPluginStatus';

type AIButtonProps = {
  children: ReactNode;
  className?: string;
  onClick: (event: React.MouseEvent<HTMLButtonElement>) => void;
  disabled?: boolean;
  interactionName: string;
};

export function AIButton({ children, className, onClick, disabled, interactionName }: AIButtonProps) {
  const { isEnabled, error, isFetching } = useFetchLlmPluginStatus();

  let icon: IconName = 'ai';

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
      className={className}
      onClick={onClickInternal}
      disabled={!isEnabled || disabled}
      title={isEnabled ? 'Ask FlameGrot AI' : 'Grafana LLM plugin missing or not configured!'}
      icon={icon}
      fill="text"
    >
      {children}
    </Button>
  );
}
