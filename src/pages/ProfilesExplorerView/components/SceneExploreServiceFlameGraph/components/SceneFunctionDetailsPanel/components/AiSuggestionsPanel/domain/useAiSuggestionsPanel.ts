import { DomainHookReturnValue } from '@shared/types/DomainHookReturnValue';

import { SuggestionPromptInputs } from './buildLlmSuggestionPrompts';
import { useOpenAiSuggestions } from './useOpenAiSuggestions';

export function useAiSuggestionsPanel(suggestionPromptInputs: SuggestionPromptInputs): DomainHookReturnValue {
  const { reply, error: llmError } = useOpenAiSuggestions(suggestionPromptInputs);

  return {
    data: {
      isLoading: !llmError && !reply.text.trim(),
      llmError,
      reply,
      shouldDisplayReply: Boolean(reply?.hasStarted || reply?.hasFinished),
      shouldDisplayFollowUpForm: !llmError && Boolean(reply?.hasFinished),
    },
    actions: {
      submitFollowupQuestion(question: string) {
        reply.askFollowupQuestion(question);
      },
    },
  };
}
