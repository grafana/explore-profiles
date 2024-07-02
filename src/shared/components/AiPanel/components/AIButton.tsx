import { css, cx } from '@emotion/css';
import { GrafanaTheme2, IconName } from '@grafana/data';
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

  let icon: IconName = 'ai';
  let title = '';

  if (error) {
    icon = 'shield-exclamation';
    title = 'Grafana LLM plugin missing or not configured!';
  } else if (isFetching) {
    icon = 'fa fa-spinner';
    title = 'Checking the status of the Grafana LLM plugin...';
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
      title={isEnabled ? 'Ask FlameGrot AI' : title}
      icon={icon}
      fill="text"
    >
      {children}
      <div id="icon-new" className={styles.sup}>
        new!
      </div>
    </Button>
  );
}

const getStyles = (theme: GrafanaTheme2) => ({
  aiButton: css`
    padding: 0;

    &:disabled #icon-new,
    &[disabled] #icon-new {
      color: ${theme.colors.text.disabled};
      background-color: transparent;
    }
  `,
  sup: css`
    color: #fff;
    background: #f37226;
    font-size: 75%;
    line-height: 0;
    position: relative;
    vertical-align: initial;
    top: -0.5em;
    margin-left: ${theme.spacing(1)};
    padding: ${theme.spacing(1)};
    border-radius: 3px;
  `,
});
