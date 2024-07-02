import { llms } from '@grafana/experimental';
import { useQuery } from '@tanstack/react-query';

export function useFetchLlmPluginStatus() {
  const { data, isFetching, error } = useQuery({
    queryKey: ['llm'],
    queryFn: () => llms.openai.enabled(),
  });

  if (error) {
    console.error('Error while checking the status of the Grafana LLM plugin!');
    console.error(error);
  }

  return { isEnabled: Boolean(data), isFetching, error };
}
