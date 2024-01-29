import {
  ProfileMetricId,
  useGetProfileMetricById,
} from '../../../../shared/infrastructure/profile-metrics/useProfileMetricsQuery';
import { useFetchDotProfile } from './useFetchDotProfile';
import { Message, useOpenAiChatCompletions } from './useOpenAiChatCompletions';

export type LlmReply = {
  text: string;
  hasStarted: boolean;
  hasFinished: boolean;
  addMessages: (messages: Message[]) => void;
  messages: Message[];
};

type UseLlmResponse = {
  loading: boolean;
  error: Error | null;
  reply: LlmReply | null;
};

// eslint-disable-next-line no-unused-vars
function stubProfile() {
  return {
    error: null,
    loading: false,
    value: require('./samples/dot-profile-1').default,
  };
}

// eslint-disable-next-line no-unused-vars
function stubReply() {
  return {
    error: null,
    loading: false,
    reply: {
      text: require('./samples/answer3').default,
      hasStarted: false,
      hasFinished: true,
    },
  };
}

export function useLlm(
  query: string,
  from: string,
  until: string,
  rightQuery?: string,
  rightFrom?: string,
  rightUntil?: string
): UseLlmResponse {
  const {
    error: profileError,
    loading: profileLoading,
    value: profileValue,
  } = useFetchDotProfile(query, from, until, rightQuery, rightFrom, rightUntil);

  // uncomment me to use pre-recorded API profile data
  // const { error: profileError, loading: profileLoading, value: profileValue } = stubProfile();

  // uncomment me to use a pre-recorded OpenAI reply
  // return stubReply();

  const rawProfileType = query.split('{')[0];
  const profileData = useGetProfileMetricById(rawProfileType as ProfileMetricId);
  const reply = useOpenAiChatCompletions(profileValue, profileData.data?.type || 'cpu');

  if (profileError) {
    console.error('Error while fetching DOT profile!');
    console.error(profileError);

    return {
      error: profileError,
      loading: false,
      reply: null,
    };
  }

  if (profileLoading) {
    return {
      loading: true,
      error: null,
      reply: null,
    };
  }

  const response = {
    error: null,
    loading: !reply.text.trim(),
    reply,
  };

  console.log('*** useLlm reply', response);

  return response;
}
