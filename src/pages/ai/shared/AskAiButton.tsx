import { css } from '@emotion/css';
import { GrafanaTheme2, IconName } from '@grafana/data';
import { llms } from '@grafana/experimental';
import { Button, useStyles2 } from '@grafana/ui';
import React from 'react';
import { useAsync } from 'react-use';

type AskAiButtonProps = {
  onClick: (event: React.MouseEvent<HTMLButtonElement>) => void;
};

// eslint-disable-next-line no-unused-vars
const getStyles = (theme: GrafanaTheme2) => ({
  askAiButton: css`
    height: 24px;
    background-color: rgb(255, 136, 51);

    position: relative;
    top: 4px;

    &:hover {
      background-color: rgb(255, 136, 51, 0.8);
    }
  `,
});

function useIsLlmEnabled() {
  const { value, error, loading } = useAsync(async () => {
    const openAIHealthDetails = await llms.openai.enabled(); // check if the LLM plugin is enabled and configured
    return openAIHealthDetails.ok;
  });

  if (error) {
    console.error('Error while checking LLM plugin status!');
    console.error(error);
    return { error };
  }

  return { isEnabled: Boolean(value), loading, error };
}

export function AskAiButton({ onClick }: AskAiButtonProps) {
  const styles = useStyles2(getStyles);

  const { isEnabled, error, loading } = useIsLlmEnabled();

  let icon: IconName = 'fire';

  if (error) {
    icon = 'shield-exclamation';
  } else if (loading) {
    icon = 'fa fa-spinner';
  }

  return (
    <Button
      className={styles.askAiButton}
      onClick={onClick}
      disabled={!isEnabled}
      title={isEnabled ? 'Ask FlameGrot AI' : 'LLM plugin missing or not configured!'}
      icon={icon}
    >
      Explain Flamegraph
    </Button>
  );
}
