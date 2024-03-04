import { llms } from '@grafana/experimental';
import { useCallback, useEffect, useRef, useState } from 'react';
import { finalize } from 'rxjs';

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
  text: string;
  hasStarted: boolean;
  hasFinished: boolean;
  messages: Message[];
  addMessages: (messagesToAdd: Message[]) => void;
};

export function useOpenAiChatCompletions(profileType: string, profiles: string[]): OpenAiReply {
  const [reply, setReply] = useState('');
  const [replyHasStarted, setReplyHasStarted] = useState(false);
  const [replyHasFinished, setReplyHasFinished] = useState(false);
  const [messages, setMessages] = useState([] as Message[]);
  const replyHasStartedRef = useRef(replyHasStarted);

  const sendMessages = useCallback(() => {
    setReplyHasStarted(true);
    setReplyHasFinished(false);
    setReply('');

    const stream = llms.openai
      .streamChatCompletions({
        model,
        messages,
      })
      .pipe(
        // Accumulate the stream content into a stream of strings, where each
        // element contains the accumulated message so far.
        llms.openai.accumulateContent(),
        // The stream is just a regular Observable, so we can use standard rxjs
        // functionality to update state, e.g. recording when the stream
        // has completed.
        // The operator decision tree on the rxjs website is a useful resource:
        // https://rxjs.dev/operator-decision-tree.
        finalize(() => {
          setReplyHasStarted(false);
          setReplyHasFinished(true);
        })
      );

    stream.subscribe(setReply);
  }, [messages, setReplyHasStarted, setReplyHasFinished]);

  const addMessages = useCallback(
    (messagesToAdd: Message[]): void => {
      messages.push(...messagesToAdd);

      setMessages(messages);
      sendMessages();
    },
    [messages, sendMessages]
  );

  useEffect(() => {
    if (!profiles.length) {
      return;
    }

    if (messages.length === 0) {
      const prompts = buildPrompts({
        system: 'empty',
        user: profiles.length === 2 ? 'diff' : 'ryan',
        profileType,
        profiles,
      });

      setMessages([
        {
          role: 'system',
          content: prompts.system,
        },
        {
          role: 'system',
          content: prompts.user,
        },
      ]);
      return;
    }

    if (replyHasStartedRef.current) {
      return;
    }

    sendMessages();
  }, [profiles, profileType, messages, setMessages, sendMessages]);

  return {
    text: reply,
    hasStarted: replyHasStarted,
    hasFinished: replyHasFinished,
    messages: messages,
    addMessages,
  };
}
