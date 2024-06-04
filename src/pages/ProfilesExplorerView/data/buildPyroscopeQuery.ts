export function buildPyroscopeQuery({
  serviceName,
  profileMetricId,
}: {
  serviceName: string;
  profileMetricId: string;
}) {
  return `${profileMetricId}{service_name="${serviceName}"}`;
}
