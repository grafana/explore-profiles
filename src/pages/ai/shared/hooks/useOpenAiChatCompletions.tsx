import { llms } from '@grafana/experimental';
import { useCallback, useEffect, useRef, useState } from 'react';
import { finalize } from 'rxjs';

import { buildExplainerPrompts, buildSuggestionPrompts, model, SuggestionPromptInputs } from './buildLlmPrompts';

// taken from "@grafana/experimental"
export type Role = 'system' | 'user' | 'assistant' | 'function';
export type Message = {
  role: Role;
  content: string;
  name?: string;
  function_call?: Object;
};
type ProfileContainer = {
  value: string;
  valueRight?: string;
};

export function useOpenAiExplainer(profile: ProfileContainer, profileType: string) {
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
    if (!profile) {
      return;
    }

    if (messages.length === 0) {
      let prompts = buildExplainerPrompts({ system: 'empty', user: 'ryan', profile: profile.value, profileType });
      if (profile.valueRight) {
        prompts = buildExplainerPrompts({
          system: 'empty',
          user: 'diff',
          profile: profile.value,
          profileType,
          profileRight: profile.valueRight,
        });
      }
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

    console.log('*** useLlm messages', messages);

    if (replyHasStartedRef.current) {
      return;
    }
    sendMessages();
  }, [profile, profileType, messages, setMessages, sendMessages]);

  return {
    text: reply,
    hasStarted: replyHasStarted,
    hasFinished: replyHasFinished,
    addMessages: addMessages,
    messages: messages,
  };
}

// TODO(@petethepig): this is largely same function as useOpenAiExplainer, maybe we should merge them somehow
export function useOpenAiSuggestions(suggestionPromptInputs: SuggestionPromptInputs) {
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
    if (!suggestionPromptInputs) {
      return;
    }
    // TODO(@petethepig): this is a stub, we should replace it with real data
    const prompts = buildSuggestionPrompts(suggestionPromptInputs);
    if (messages.length === 0) {
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

    console.log('*** useLlm messages', messages);

    if (replyHasStartedRef.current) {
      return;
    }
    sendMessages();
  }, [messages, setMessages, sendMessages, suggestionPromptInputs]);

  return {
    text: reply,
    hasStarted: replyHasStarted,
    hasFinished: replyHasFinished,
    addMessages: addMessages,
    messages: messages,
  };
}
