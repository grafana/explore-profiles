import { TimeRange } from '@grafana/data';

import { PprofRequest } from './PprofRequest';

function createBiggestInterval({ from, until }: { from: number[]; until: number[] }) {
  return {
    from: Math.min(...from),
    until: Math.max(...until),
  };
}

function biggestTimeRangeInUnixMs(timeRange: TimeRange) {
  return createBiggestInterval({
    from: [timeRange.from].map((d) => d.valueOf()),
    until: [timeRange.to].map((d) => d.valueOf()),
  });

  // TODO: left and right
  // return createBiggestInterval({
  //   from: [state.from, state.leftFrom, state.rightFrom].map(formatAsOBject).map((d) => d.valueOf()),
  //   until: [state.until, state.leftUntil, state.leftUntil].map(formatAsOBject).map((d) => d.valueOf()),
  // });
}

export function buildPprofQuery(query: string, timeRange: TimeRange) {
  const labelsIndex = query.indexOf('{');
  const profileTypeID = query.substring(0, labelsIndex);
  const label_selector = query.substring(labelsIndex);
  const { from, until } = biggestTimeRangeInUnixMs(timeRange);

  const message = new PprofRequest(profileTypeID, label_selector, from, until);

  return PprofRequest.encode(message).finish();
}
