export const buildPyroscopeQuery = ({
  serviceName,
  profileMetricId,
}: {
  serviceName: string;
  profileMetricId: string;
}) => `${profileMetricId}{service_name="${serviceName}"}`;
