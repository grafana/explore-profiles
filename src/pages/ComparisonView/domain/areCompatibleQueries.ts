import { parseQuery } from '@shared/domain/url-params/parseQuery';

export function areCompatibleQueries(query: string, leftQuery: string, rightQuery: string): boolean {
  const { serviceId: expectedServiceId, profileMetricId: expectedProfileMetricId } = parseQuery(query);

  return [leftQuery, rightQuery].every((q) => {
    const { serviceId, profileMetricId } = parseQuery(q);
    return serviceId === expectedServiceId && profileMetricId === expectedProfileMetricId;
  });
}
