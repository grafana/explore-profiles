export type RecordingRuleViewModel = {
  id: string;
  metricName: string;
  serviceName?: string;
  profileType: string;
  matchers: string[];
  groupBy: string[];
  functionName?: string;
  readonly: boolean;
};
