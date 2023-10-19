import { Query } from '@pyroscope/models/query';

import { ProfileMetric, ProfileMetricId, useGetProfileMetricById } from './useProfileMetricsQuery';
import { Dispatch, SetStateAction, useMemo, useState } from 'react';

export type ParsedQuery = {
  profileMetric: ProfileMetric;
  query: Query;
  setQuery: Dispatch<SetStateAction<Query>>;
};

function parseQueryString(queryWithProfileString: Query) {
  const [, profileMetricId = '', query = ''] = queryWithProfileString.match(/^([^{]*)(.+)/) || [];

  return {
    profileMetricId: profileMetricId as ProfileMetricId,
    query: query as Query,
  };
}

export function useParseQuery(initialQuery: Query): ParsedQuery {
  const [query, setQuery] = useState<Query>('' as Query);

  const parsedQuery = useMemo(() => {
    const parsedQuery = parseQueryString(initialQuery);

    setQuery(parsedQuery.query);

    return parsedQuery;
  }, [initialQuery]);

  const { data: profileMetric } = useGetProfileMetricById(parsedQuery.profileMetricId);

  return {
    profileMetric,
    query,
    setQuery,
  };
}
