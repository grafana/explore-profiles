export interface TimedAnnotation {
  timestamp: number;
  annotation: RawProfileAnnotation;
}

export interface RawProfileAnnotation {
  key: string;
  value: string;
}

export enum ProfileAnnotationKey {
  Throttled = 'pyroscope.ingest.throttled',
}

export interface ProfileAnnotation {
  body: ProfileThrottledAnnotation;
}

export interface ProfileThrottledAnnotation {
  periodType: string;
  periodLimitMb: number;
  limitResetTime: number;
  samplingPeriodSec: number;
  samplingRequests: number;
  usageGroup: string;
}
