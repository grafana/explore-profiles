type ParsedQuery = {
  serviceId: string;
  profileMetricId: string;
};

export function parseQuery(query: string): ParsedQuery {
  const [, serviceId = ''] = query.match(/.+\{.*service_name="([^"]+)".*\}/) || [];
  const [, profileMetricId = ''] = query.match(/([^{]+)\{.*}/) || [];

  return { serviceId, profileMetricId };
}

type BuildQueryParams = {
  serviceId: string;
  profileMetricId: string;
};

export const buildQuery = ({ serviceId, profileMetricId }: BuildQueryParams): string =>
  `${profileMetricId}{service_name="${serviceId}"}`;
