import { css } from '@emotion/css';
import { GrafanaTheme2 } from '@grafana/data';
import { Icon, useStyles2 } from '@grafana/ui';
import React from 'react';

export const FEEDBACK_FORM_URL = 'https://grafana.qualtrics.com/jfe/form/SV_6Gav4IUU6jcYfd4';

// borrowed from https://github.com/grafana/explore-logs/blob/main/src/Components/IndexScene/GiveFeedbackButton.tsx
export const GiveFeedbackButton = () => {
  const styles = useStyles2(getStyles);

  return (
    <div className={styles.wrapper}>
      <a
        href={FEEDBACK_FORM_URL}
        className={styles.feedback}
        title="Share your thoughts about Profiles in Grafana."
        target="_blank"
        rel="noreferrer noopener"
      >
        <Icon name="comment-alt-message" /> Give feedback
      </a>
    </div>
  );
};

const getStyles = (theme: GrafanaTheme2) => {
  return {
    wrapper: css({
      display: 'flex',
      gap: theme.spacing(1),
      justifyContent: 'flex-end',
      paddingTop: '4px',
    }),
    feedback: css({
      alignSelf: 'center',
      color: theme.colors.text.secondary,
      fontSize: theme.typography.bodySmall.fontSize,
      '&:hover': {
        color: theme.colors.text.link,
      },
    }),
  };
};
