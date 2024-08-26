import { css } from '@emotion/css';
import { Button, TextArea, useStyles2 } from '@grafana/ui';
import React, { KeyboardEvent, useCallback, useState } from 'react';

const getStyles = () => ({
  textarea: css`
    margin-bottom: 8px;
  `,
  sendButton: css`
    float: right;
    border-top-left-radius: 0;
    border-bottom-left-radius: 0;
  `,
});

type FollowUpFormProps = {
  onSubmit: (question: string) => void;
};

function useFollowUpForm(onSubmit: FollowUpFormProps['onSubmit']) {
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

export function FollowUpForm({ onSubmit }: FollowUpFormProps) {
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
        placeholder="Ask a follow-up question..."
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
