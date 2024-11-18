import { openai } from '@grafana/llm';
import { logger } from '@shared/infrastructure/tracking/logger';
import { useQuery } from '@tanstack/react-query';

export function useFetchLlmPluginStatus() {
  const { data, isFetching, error } = useQuery({
    queryKey: ['llm'],
    queryFn: () => openai.enabled(),
  });

  if (error) {
    logger.error(error, { info: 'Error while checking the status of the Grafana LLM plugin!' });
  }

  return { isEnabled: Boolean(data), isFetching, error };
}
