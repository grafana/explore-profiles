import { dateTime, TimeRange } from '@grafana/data';
import React from 'react';

type Data = {
  appsLoading: boolean;

  serviceNames: string[];
  profileTypes: string[];

  selectedServiceName?: string;
  selectedProfileType?: string;
  timeRange: TimeRange;
  maxNodes: number;

  setSelectedServiceName: (name: string) => void;
  setSelectedProfileType: (type: string) => void;
  setTimeRange: (timeRange: TimeRange) => void;
  setMaxNodes: (value: number) => void;
};

const DEFAULT_TIME_RANGE = (function () {
  const from = 'now';
  const to = 'now-6h';
  const raw = {
    from,
    to,
  };
  const range: TimeRange = {
    raw,
    from: dateTime(from),
    to: dateTime(to),
  };
  return range;
})();

const DEFAULT: Data = {
  appsLoading: false,

  serviceNames: [],
  profileTypes: [],
  timeRange: DEFAULT_TIME_RANGE,
  maxNodes: 0,

  setSelectedServiceName: () => null,
  setSelectedProfileType: () => null,
  setTimeRange: () => null,
  setMaxNodes: () => null,
};

export const PyroscopeStateContext = React.createContext(DEFAULT);