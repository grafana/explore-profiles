import { pprofApiClient } from '@shared/components/FlameGraph/components/infrastructure/pprofApiClient';
import {
  PLACEHOLDER_COMMIT_DATA,
  privateVcsClient,
} from '@shared/components/GitHubContextProvider/infrastructure/PrivateVcsClient';
import { timelineAndProfileApiClient } from '@shared/infrastructure/timeline-profile/timelineAndProfileApiClient';
import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';

import { convertPprofToFunctionDetails } from '../domain/convertPprofToFunctionDetails';
import { FunctionDetails } from '../types/FunctionDetails';

type FetchParams = {
  profileMetricId: string;
  labelsSelector: string;
  stacktrace: string[];
  isGitHubLogged: boolean;
};

type FetchResponse = {
  isFetching: boolean;
  error: Error | null;
  functionsDetails: FunctionDetails[];
};

const getTotalSum = (fd: FunctionDetails): number =>
  Array.from(fd.callSites.values()).reduce((acc, { cum }) => acc + cum, 0);

const sortByTotal = (a: FunctionDetails, b: FunctionDetails) => getTotalSum(b) - getTotalSum(a);

// eslint-disable-next-line sonarjs/cognitive-complexity
export function useFetchFunctionsDetails({
  profileMetricId,
  labelsSelector,
  stacktrace,
  isGitHubLogged,
}: FetchParams): FetchResponse {
  let start = 0;
  let end = 0;
  let timeRangeError: Error | null = null;

  try {
    // We get the time range that was used for fetching the main timeline and
    // flame graph data to ensure data consistency.
    //
    // see https://github.com/grafana/pyroscope-squad/issues/131
    [start, end] = timelineAndProfileApiClient.getLastTimeRange();
  } catch (e) {
    timeRangeError = e as Error;
  }

  const {
    isFetching,
    error: queryError,
    data,
  } = useQuery({
    enabled: Boolean(profileMetricId && labelsSelector && stacktrace.length > 0 && start > 0 && end > 0 && !timeRangeError),
    // eslint-disable-next-line @tanstack/query/exhaustive-deps
    queryKey: ['function-details', profileMetricId, labelsSelector, start, end, stacktrace, isGitHubLogged],
    queryFn: async () => {
      const pprof = await pprofApiClient.selectMergeProfileJson({
        profileMetricId,
        labelsSelector,
        start,
        end,
        stacktrace,
        // We don't expect more than 500 nodes after the selected node.
        // This will avoid downloading too much data by removing leaf nodes.
        maxNodes: 500, // TODO: This could be a setting in the UI.
      });

      const functionsDetails = convertPprofToFunctionDetails(stacktrace[stacktrace.length - 1], pprof).sort(
        sortByTotal
      );

      if (!isGitHubLogged) {
        return functionsDetails;
      }

      const commits = functionsDetails.map((details) => ({
        repositoryUrl: details?.version?.repository || '',
        gitRef: details?.version?.git_ref || 'HEAD',
      }));

      // TODO: extract to its own hook and simplify useFunctionDetailsPanel()?
      const commitsInfo = await privateVcsClient.getCommits(commits);

      commitsInfo.forEach((commit, i) => {
        functionsDetails[i].commit = commit;
      });

      return functionsDetails;
    },
  });

  return {
    isFetching,
    error: timeRangeError || (privateVcsClient.isAbortError(queryError) ? null : queryError),
    functionsDetails: useMemo(
      () =>
        data && data.length > 0
          ? data
          : [
              {
                name: stacktrace.at(-1) as string,
                startLine: undefined,
                fileName: '',
                callSites: new Map(),
                unit: '',
                commit: PLACEHOLDER_COMMIT_DATA,
              },
            ],
      [data, stacktrace]
    ),
  };
}
