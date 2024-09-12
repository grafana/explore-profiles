import { useQuery } from '@tanstack/react-query';

import { DataSourceProxyClientBuilder } from '../../../../../../../infrastructure/series/http/DataSourceProxyClientBuilder';
import { PrivateVcsClient } from '../../GitHubContextProvider/infrastructure/PrivateVcsClient';

type FetchParams = {
  enabled: boolean;
  dataSourceUid: string;
  repository: string;
  gitRef: string;
  localPath: string;
  rootPath: string;
};

type FetchResponse = {
  isFetching: boolean;
  error: Error | null;
  fileInfo?: {
    content: string;
    URL: string;
  };
};

export function useFetchVCSFile({ enabled, dataSourceUid, repository, gitRef, localPath, rootPath }: FetchParams): FetchResponse {
  const privateVcsClient = DataSourceProxyClientBuilder.build(dataSourceUid, PrivateVcsClient);
  const { isFetching, error, data } = useQuery({
    enabled: Boolean(enabled && localPath),
    queryKey: ['vcs-file', repository, gitRef, localPath, rootPath],
    queryFn: () =>
      privateVcsClient
        .getFile(repository, gitRef, localPath, rootPath)
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
