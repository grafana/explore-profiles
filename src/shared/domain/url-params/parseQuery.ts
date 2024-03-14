type ParsedQuery = {
  serviceId: string;
  profileMetricId: string;
  labelsSelector: string;
};

export function parseQuery(query: string): ParsedQuery {
  const [, serviceId = ''] = query.match(/.+\{.*service_name="([^"]+)".*\}/) || [];
  const [, profileMetricId = ''] = query.match(/([^{]+)\{.*}/) || [];

  const labelsSelector = query.substring(query.indexOf('{'));

  return { serviceId, profileMetricId, labelsSelector };
}

type BuildQueryParams = {
  serviceId: string;
  profileMetricId: string;
};

export const buildQuery = ({ serviceId, profileMetricId }: BuildQueryParams): string =>
  `${profileMetricId}{service_name="${serviceId}"}`;
