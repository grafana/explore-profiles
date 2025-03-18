import { recordingRulesApiClient } from '@shared/infrastructure/recording-rules/recordingRulesApiClient';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { RecordingRuleViewModel } from '../../../pages/RecordingRulesView/domain/RecordingRuleViewModel';

type FetchParams = {
  enabled?: boolean;
};

type FetchResponse = {
  isFetching: boolean;
  error: Error | null;
  recordingRules?: RecordingRuleViewModel[];
  mutate: (rule: RecordingRuleViewModel) => Promise<void>;
  remove: (rule: RecordingRuleViewModel) => Promise<void>;
};

export function useFetchRecordingRules({ enabled }: FetchParams = {}): FetchResponse {
  const queryClient = useQueryClient();

  const { isFetching, error, data } = useQuery({
    enabled,
    queryKey: ['recording_rules'],
    queryFn: () => recordingRulesApiClient.get(),
  });

  const { mutateAsync: mutate } = useMutation({
    mutationFn: (rule: RecordingRuleViewModel) => recordingRulesApiClient.create(rule),
    networkMode: 'always',
  });

  const { mutateAsync: remove } = useMutation({
    mutationFn: async (rule: RecordingRuleViewModel) => {
      await recordingRulesApiClient.remove(rule);
      await queryClient.invalidateQueries({ queryKey: ['recording_rules'] });
    },
    networkMode: 'always',
  });

  return {
    isFetching,
    error: recordingRulesApiClient.isAbortError(error) ? null : error,
    recordingRules: data,
    mutate,
    remove,
  };
}
