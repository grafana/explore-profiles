import { css } from '@emotion/css';
import { GrafanaTheme2 } from '@grafana/data';
import { Button, TextArea, useStyles2 } from '@grafana/ui';
import React, { KeyboardEvent, useCallback, useState } from 'react';

type AiPanelFollowUpFormProps = {
  onSubmit: (question: string) => void;
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

    onSubmit(questionToSend);

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

  const onKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.code === 'Enter' && !event.shiftKey) {
      onClickSend();
    }
  };

  return (
    <div>
      <TextArea
        className={styles.textarea}
        placeholder="Ask me something else..."
        value={question}
        onChange={onChangeInput}
        onKeyDown={onKeyDown}
      />

      <Button className={styles.sendButton} onClick={onClickSend}>
        Send
      </Button>
    </div>
  );
}
