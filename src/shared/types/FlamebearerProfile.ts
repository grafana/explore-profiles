export type FlamebearerProfile = {
  version: number;
  flamebearer: Flamebearer;
  metadata: {
    appName?: string;
    endTime?: number;
    format: string;
    maxNodes?: number;
    name?: string;
    query?: string;
    sampleRate: number;
    spyName: string;
    startTime?: number;
    units: string;
  };
  leftTicks?: number;
  rightTicks?: number;
};

type Flamebearer = {
  numTicks: number;
  maxSelf: number;
  names: string[];
  levels: number[][];
};
