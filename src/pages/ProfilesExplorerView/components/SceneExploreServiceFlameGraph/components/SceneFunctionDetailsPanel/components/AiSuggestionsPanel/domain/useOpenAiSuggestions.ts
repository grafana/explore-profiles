import { openai } from '@grafana/llm';
import { useCallback, useEffect, useState } from 'react';

import { buildSuggestionPrompts, model, SuggestionPromptInputs } from './buildLlmSuggestionPrompts';

type Messages = openai.Message[];

// TODO(@petethepig): this is largely same function as useOpenAiChatCompletions, maybe we should merge them somehow
export function useOpenAiSuggestions(suggestionPromptInputs: SuggestionPromptInputs) {
  const [reply, setReply] = useState('');
  const [replyHasStarted, setReplyHasStarted] = useState(false);
  const [replyHasFinished, setReplyHasFinished] = useState(false);
  const [messages, setMessages] = useState<Messages>([]);
  const [error, setError] = useState<Error | null>(null);

  const sendMessages = useCallback((messagesToSend: Messages) => {
    setMessages(messagesToSend);

    setError(null);

    setReply('');
    setReplyHasStarted(true);
    setReplyHasFinished(false);

    const stream = openai
      .streamChatCompletions({
        model,
        messages: messagesToSend,
      })
      .pipe(
        // Accumulate the stream content into a stream of strings, where each
        // element contains the accumulated message so far.
        openai.accumulateContent()
      );

    stream.subscribe({
      next: setReply,
      error(e) {
        setError(e);
        setReplyHasStarted(false);
        setReplyHasFinished(true);
      },
      complete() {
        setReplyHasStarted(false);
        setReplyHasFinished(true);
      },
    });
  }, []);

  const askFollowupQuestion = useCallback(
    (question: string): void => {
      const messagesToAdd: Messages = [
        {
          role: 'assistant',
          content: reply,
        },
        {
          role: 'user',
          content: question,
        },
      ];

      try {
        sendMessages([...messages, ...messagesToAdd]);
      } catch (error) {
        setError(error as Error);
      }
    },
    [messages, reply, sendMessages]
  );

  useEffect(() => {
    if (messages.length > 0) {
      return;
    }

    const prompts = buildSuggestionPrompts(suggestionPromptInputs);

    try {
      sendMessages([
        {
          role: 'system',
          content: prompts.user,
        },
      ]);
    } catch (error) {
      setError(error as Error);
    }
  }, [messages.length, suggestionPromptInputs, sendMessages]);

  return {
    reply: {
      text: reply,
      hasStarted: replyHasStarted,
      hasFinished: replyHasFinished,
      messages: messages,
      askFollowupQuestion,
    },
    error,
  };
}
