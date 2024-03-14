import { TimeRange } from '@grafana/data';
import { pprofApiClient } from '@shared/components/FlameGraph/components/infrastructure/pprofApiClient';
import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';

import { convertPprofToFunctionDetails } from '../domain/convertPprofToFunctionDetails';
import { FunctionDetails } from '../types/FunctionDetails';
import { PLACEHOLDER_COMMIT_DATA, vcsClient } from './vcsClient';

type FetchParams = {
  timeRange: TimeRange;
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
  timeRange,
  profileMetricId,
  labelsSelector,
  stacktrace,
  isGitHubLogged,
}: FetchParams): FetchResponse {
  const start = timeRange.from.unix() * 1000;
  const end = timeRange.to.unix() * 1000;

  const { isFetching, error, data } = useQuery({
    enabled: Boolean(profileMetricId && labelsSelector && stacktrace.length > 0),
    // eslint-disable-next-line @tanstack/query/exhaustive-deps
    queryKey: [profileMetricId, labelsSelector, start, end, stacktrace, isGitHubLogged],
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
      const commitsInfo = await vcsClient.getCommits(commits);

      commitsInfo.forEach((commit, i) => {
        functionsDetails[i].commit = commit;
      });

      return functionsDetails;
    },
  });

  return {
    isFetching,
    error: vcsClient.isAbortError(error) ? null : error,
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
