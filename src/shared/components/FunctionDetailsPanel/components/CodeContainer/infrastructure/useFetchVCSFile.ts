import { privateVcsClient } from '@shared/components/GitHubContextProvider/infrastructure/PrivateVcsClient';
import { useQuery } from '@tanstack/react-query';

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
    queryKey: ['vcs-file', repository, gitRef, path],
    queryFn: () =>
      privateVcsClient
        .getFile(repository, gitRef, path)
        .then((code) => ({
          content: code.content,
          URL: code.URL,
        }))
        .then((json) => ({ URL: json.URL, content: atob(json.content) })),
  });

  return {
    isFetching,
    error: privateVcsClient.isAbortError(error) ? null : error,
    fileInfo: data,
  };
}
