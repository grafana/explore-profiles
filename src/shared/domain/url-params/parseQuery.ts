type ParsedQuery = {
  serviceId: string;
  profileMetricId: string;
  labelsSelector: string;
  labels: string[];
};

export function parseQuery(query: string): ParsedQuery {
  const [, serviceId = ''] = query.match(/.+\{.*service_name="([^"]+)".*\}/) || [];
  const [, profileMetricId = ''] = query.match(/([^{]+)\{.*}/) || [];

  const labelsSelector = query.substring(query.indexOf('{'));

  const labels = labelsSelector
    .replace(/(\{|\})/, '')
    .split(',')
    .map((m) => m.match(/\W*([^=!~]+)(=|!=|=~|!~)"(.*)"/)?.[0])
    .filter((label) => label && !label.includes('service_name')) as string[];

  return { serviceId, profileMetricId, labelsSelector, labels };
}

type BuildQueryParams = {
  serviceId: string;
  profileMetricId: string;
  labels?: string[];
};

export const buildQuery = ({ serviceId, profileMetricId, labels }: BuildQueryParams): string =>
  labels?.length
    ? `${profileMetricId}{service_name="${serviceId}",${labels.join()}}`
    : `${profileMetricId}{service_name="${serviceId}"}`;
