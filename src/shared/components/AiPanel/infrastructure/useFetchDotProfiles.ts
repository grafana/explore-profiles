import { dateTimeParse, TimeRange } from '@grafana/data';
import { ApiClient } from '@shared/infrastructure/http/ApiClient';
import { useQuery } from '@tanstack/react-query';

const apiClient = new ApiClient();

const MAX_NODES = 100;

function buildSearchParams(query: string, timeRange: TimeRange): string {
  // /pyroscope/render requests: timerange can be YYYYDDMM, Unix time, Unix time in ms (unix * 1000)
  const from = Number(dateTimeParse(timeRange.raw.from).unix()) * 1000;
  const until = Number(dateTimeParse(timeRange.raw.to).unix()) * 1000;

  const searchParams = new URLSearchParams({
    query,
    from: String(from),
    until: String(until),
    format: 'dot',
    'max-nodes': String(MAX_NODES),
  });

  return searchParams.toString();
}

function cleanupDotResponse(profile: string): string {
  return profile
    .replace(/fontsize=\d+ /g, '')
    .replace(/id="node\d+" /g, '')
    .replace(/labeltooltip=".*\)" /g, '')
    .replace(/tooltip=".*\)" /g, '')
    .replace(/(N\d+ -> N\d+).*/g, '$1')
    .replace(/N\d+ \[label="other.*\n/, '')
    .replace(/shape=box /g, '')
    .replace(/fillcolor="#\w{6}"/g, '')
    .replace(/color="#\w{6}" /g, '');
}

type FetchParam = {
  query: string;
  timeRange: TimeRange;
};

type FetchParams = FetchParam[];

type FetchResponse = {
  isFetching: boolean;
  error: Error | null;
  profiles: string[];
};

export function useFetchDotProfiles(fetchParams: FetchParams): FetchResponse {
  const { isFetching, error, data } = useQuery({
    queryKey: fetchParams.reduce((acc, { query, timeRange }) => {
      acc.push(query);
      acc.push(timeRange.raw.from.toString());
      acc.push(timeRange.raw.to.toString());
      return acc;
    }, [] as string[]),
    queryFn: () => {
      // TODO FIXME: pass a signal options to fetch to properly abort all in-flight requests
      // apiClient.abort();

      // we're not using timelineAndProfileApiClient here because timelineAndProfileApiClient
      // holds the timerange used for each request
      // this timerange is then used when fetching function details to ensure data consistency
      // (see https://github.com/grafana/pyroscope-squad/issues/131)

      // TODO: see also useFetchTimelineAndProfile.ts and find a better solution
      return Promise.all(
        fetchParams.map(({ query, timeRange }) =>
          apiClient
            .fetch(`/pyroscope/render?${buildSearchParams(query, timeRange)}`)
            .then((response) => response.text())
            .then(cleanupDotResponse)
        )
      );
    },
  });

  return {
    isFetching,
    error,
    profiles: data || [],
  };
}
