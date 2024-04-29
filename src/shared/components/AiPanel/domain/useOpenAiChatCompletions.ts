import { llms } from '@grafana/experimental';
import { useCallback, useEffect, useState } from 'react';
import { Subscription } from 'rxjs';

import { buildPrompts, model } from './buildLlmPrompts';

// taken from "@grafana/experimental"
type Role = 'system' | 'user' | 'assistant' | 'function';

type Message = {
  role: Role;
  content: string;
  name?: string;
  function_call?: Object;
};

export type OpenAiReply = {
  reply: {
    text: string;
    hasStarted: boolean;
    hasFinished: boolean;
    messages: Message[];
    askFollowupQuestion: (question: string) => void;
  };
  retry: () => void;
  error: Error | null;
};

export function useOpenAiChatCompletions(profileType: string, profiles: string[]): OpenAiReply {
  const [reply, setReply] = useState('');
  const [replyHasStarted, setReplyHasStarted] = useState(false);
  const [replyHasFinished, setReplyHasFinished] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [error, setError] = useState<Error | null>(null);
  const [subscription, setSubscription] = useState<Subscription>();

  const sendMessages = useCallback((messagesToSend: Message[]) => {
    setMessages(messagesToSend);

    setError(null);

    setReply('');
    setReplyHasStarted(true);
    setReplyHasFinished(false);

    const stream = llms.openai
      .streamChatCompletions({
        model,
        messages: messagesToSend,
      })
      .pipe(
        // Accumulate the stream content into a stream of strings, where each
        // element contains the accumulated message so far.
        llms.openai.accumulateContent()
      );

    const subscription = stream.subscribe({
      next: setReply,
      error(e) {
        setError(e);
        setReplyHasStarted(false);
        setReplyHasFinished(true);
        setSubscription(undefined);
      },
      complete() {
        setReplyHasStarted(false);
        setReplyHasFinished(true);
        setSubscription(undefined);
      },
    });

    setSubscription(subscription);
  }, []);

  const askFollowupQuestion = useCallback(
    (question: string): void => {
      const messagesToAdd: Message[] = [
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
    if (!profiles.length || messages.length > 0) {
      return;
    }

    const prompts = buildPrompts({
      system: 'empty',
      user: profiles.length === 2 ? 'diff' : 'single',
      profileType,
      profiles,
    });

    try {
      sendMessages([
        {
          role: 'system',
          content: prompts.system,
        },
        {
          role: 'system',
          content: prompts.user,
        },
      ]);
    } catch (error) {
      setError(error as Error);
    }
  }, [messages.length, profileType, profiles, profiles.length, sendMessages]);

  useEffect(() => {
    return () => {
      if (subscription) {
        subscription.unsubscribe();
        setSubscription(undefined);
      }
    };
  }, [subscription]);

  return {
    reply: {
      text: reply,
      hasStarted: replyHasStarted,
      hasFinished: replyHasFinished,
      messages: messages,
      askFollowupQuestion,
    },
    retry() {
      if (messages.length > 0) {
        try {
          sendMessages(messages);
        } catch (error) {
          setError(error as Error);
        }
      }
    },
    error,
  };
}
