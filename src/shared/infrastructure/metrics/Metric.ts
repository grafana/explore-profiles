export type Metric = {
  version: number;
  name: string;
  profileType: string;
  serviceName: string;
  labels: string[];
  prometheusDataSource: string;
};
