import { css, cx } from '@emotion/css';
import { IconName } from '@grafana/data';
import { Button, useStyles2 } from '@grafana/ui';
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
  const styles = useStyles2(getStyles);
  const { isEnabled, error, isFetching } = useFetchLlmPluginStatus();

  // let icon: IconName = 'ai'; // TODO: uncomment when the feature is more mature
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
      className={cx(className, styles.aiButton)}
      onClick={onClickInternal}
      disabled={!isEnabled || disabled}
      title={isEnabled ? 'Ask FlameGrot AI' : 'Grafana LLM plugin missing or not configured!'}
      icon={icon}
      // TODO: uncomment when the feature is more mature
      // fill="text"
    >
      {children}
    </Button>
  );
}

const getStyles = () => ({
  // TODO: remove when the feature is more mature
  aiButton: css`
    background-color: #8025ff;
    &:not([disabled]):hover {
      background-color: #6c27d3;
    }
  `,
});
