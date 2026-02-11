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

type HierarchyFilter = {
  label: string;
  value: string;
};

type ParsedQueryWithHierarchy = ParsedQuery & {
  hierarchyFilters: HierarchyFilter[];
};

export function parseQueryWithHierarchy(query: string, groupByLabels: string[]): ParsedQueryWithHierarchy {
  const base = parseQuery(query);
  const hierarchyFilters: HierarchyFilter[] = [];

  for (const label of groupByLabels) {
    const regex = new RegExp(`${label}="([^"]+)"`);
    const match = query.match(regex);
    if (match && match[1]) {
      hierarchyFilters.push({ label, value: match[1] });
    }
  }

  return { ...base, hierarchyFilters };
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

type BuildQueryWithHierarchyParams = {
  hierarchyFilters: HierarchyFilter[];
  profileMetricId: string;
  labels?: string[];
};

export const buildQueryWithHierarchy = ({
  hierarchyFilters,
  profileMetricId,
  labels,
}: BuildQueryWithHierarchyParams): string => {
  const hierarchySelector = hierarchyFilters.map(({ label, value }) => `${label}="${value}"`).join(',');

  if (labels?.length) {
    return `${profileMetricId}{${hierarchySelector},${labels.join()}}`;
  }

  return `${profileMetricId}{${hierarchySelector}}`
};
