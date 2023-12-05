import { llms } from '@grafana/experimental';
import { useEffect, useState } from 'react';
import { finalize } from 'rxjs';
import { model, buildPrompts } from './buildLlmPrompts';

// taken from "@grafana/experimental"
type Role = 'system' | 'user' | 'assistant' | 'function';
type Message = {
  role: Role;
  content: string;
  name?: string;
  function_call?: Object;
};
type Messages = Message[];

export function useOpenAiChatCompletions(profile: string) {
  const [reply, setReply] = useState('');
  const [replyHasStarted, setReplyHasStarted] = useState(false);
  const [replyHasFinished, setReplyHasFinished] = useState(false);

  useEffect(() => {
    if (!profile) {
      return;
    }

    const prompts = buildPrompts({ system: 'empty', user: 'anton', profile });
    const messages: Messages = [
      {
        role: 'system',
        content: prompts.system,
      },
      {
        role: 'user',
        content: prompts.user,
      },
    ];

    console.log('*** useLlm messages', messages);

    setReplyHasStarted(true);
    setReplyHasFinished(false);

    // TODO: handle errors
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

    return () => {
      // TODO
    };
  }, [profile]);

  return {
    text: reply,
    hasStarted: replyHasStarted,
    hasFinished: replyHasFinished,
  };
}
