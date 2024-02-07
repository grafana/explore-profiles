export function parseQuery(query: string) {
  const [, service = ''] = query.match(/.+\{.*service_name="([^"]+)".*\}/) || [];
  const [, profileType = ''] = query.match(/([^{]+)\{.*}/) || [];

  return { service, profileType };
}

export const buildQuery = ({ service, profileType }: { service: string; profileType: string }) =>
  `${profileType}{service_name="${service}"}`;
