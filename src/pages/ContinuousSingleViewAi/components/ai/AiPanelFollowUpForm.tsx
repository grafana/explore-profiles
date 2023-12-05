import { css } from '@emotion/css';
import { GrafanaTheme2 } from '@grafana/data';
import { Button, TextArea, useStyles2 } from '@grafana/ui';
import React, { useCallback, useState } from 'react';

type AiPanelFollowUpFormProps = {
  onSubmit: (event: any, question: string) => void;
};

// eslint-disable-next-line no-unused-vars
const getStyles = (theme: GrafanaTheme2) => ({
  textarea: css`
    margin-bottom: 8px;
  `,
  sendButton: css`
    float: right;
    border-top-left-radius: 0;
    border-bottom-left-radius: 0;
  `,
});

function useFollowUpForm(onSubmit: AiPanelFollowUpFormProps['onSubmit']) {
  const [question, setQuestion] = useState('');

  const onChangeInput = useCallback((event: any) => {
    setQuestion(event.target.value);
  }, []);

  const onClickSend = useCallback(() => {
    const questionToSend = question.trim();
    if (!questionToSend) {
      return;
    }

    onSubmit(event, questionToSend);

    setQuestion('');
  }, [question, onSubmit]);

  return {
    question,
    onChangeInput,
    onClickSend,
  };
}

export function AiPanelFollowUpForm({ onSubmit }: AiPanelFollowUpFormProps) {
  const styles = useStyles2(getStyles);
  const { question, onChangeInput, onClickSend } = useFollowUpForm(onSubmit);

  return (
    <div>
      <TextArea
        className={styles.textarea}
        placeholder="Ask me something else..."
        value={question}
        onChange={onChangeInput}
      />

      <Button className={styles.sendButton} onClick={onClickSend}>
        Send
      </Button>
    </div>
  );
}
