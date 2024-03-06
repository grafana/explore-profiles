import { parseQuery } from '@shared/domain/url-params/parseQuery';
import { useQueryFromUrl } from '@shared/domain/url-params/useQueryFromUrl';
import { useTimeRangeFromUrl } from '@shared/domain/url-params/useTimeRangeFromUrl';
import { getProfileMetric, ProfileMetricId } from '@shared/infrastructure/profile-metrics/getProfileMetric';
import { DomainHookReturnValue } from '@shared/types/DomainHookReturnValue';

import { useFetchDotProfiles } from '../infrastructure/useFetchDotProfiles';
import { parseLeftRightUrlSearchParams } from './parseLeftRightUrlSearchParams';
import { useOpenAiChatCompletions } from './useOpenAiChatCompletions';

export function useAiPanel(isDiff?: boolean): DomainHookReturnValue {
  const [query] = useQueryFromUrl();
  const [timeRange] = useTimeRangeFromUrl();

  // TODO: define custom hooks instead of parseLeftRightUrlSearchParams()
  const fetchProfileParams = isDiff ? parseLeftRightUrlSearchParams() : [{ query, timeRange }];

  const { error: fetchError, isFetching, profiles } = useFetchDotProfiles(fetchProfileParams);

  const { profileMetricId } = parseQuery(fetchProfileParams[0].query);
  const profileType = getProfileMetric(profileMetricId as ProfileMetricId).type;

  const { reply, error: llmError } = useOpenAiChatCompletions(profileType, profiles);

  return {
    data: {
      isLoading: isFetching || (!isFetching && !fetchError && !llmError && !reply.text.trim()),
      fetchError,
      llmError,
      reply,
      shouldDisplayReply: Boolean(reply?.hasStarted || reply?.hasFinished),
      shouldDisplayFollowUpForm: !fetchError && !llmError && Boolean(reply?.hasFinished),
    },
    actions: {
      submitFollowupQuestion(question: string) {
        reply.askFollowupQuestion(question);
      },
    },
  };
}
