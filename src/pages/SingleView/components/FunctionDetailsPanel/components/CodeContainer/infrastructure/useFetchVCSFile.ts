import { useQuery } from '@tanstack/react-query';

import { vcsClient } from '../../../infrastructure/vcsClient';

type FetchParams = {
  enabled: boolean;
  repository: string;
  gitRef: string;
  path: string;
};

type FetchResponse = {
  isFetching: boolean;
  error: Error | null;
  fileInfo?: {
    content: string;
    URL: string;
  };
};

export function useFetchVCSFile({ enabled, repository, gitRef, path }: FetchParams): FetchResponse {
  const { isFetching, error, data } = useQuery({
    enabled: Boolean(enabled && path),
    queryKey: [repository, gitRef, path],
    queryFn: () =>
      vcsClient
        .getFile(repository, gitRef, path)
        .then((code) => ({
          content: code.content,
          URL: code.URL,
        }))
        .then((json) => ({ URL: json.URL, content: atob(json.content) })),
  });

  return {
    isFetching,
    error: vcsClient.isAbortError(error) ? null : error,
    fileInfo: data,
  };
}
