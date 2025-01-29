export type Metric = {
  version: number;
  name: string;
  serviceName: string;
  profileType: string;
  matcher: string;
  labels: string[];
  prometheusDataSource: string;
};
