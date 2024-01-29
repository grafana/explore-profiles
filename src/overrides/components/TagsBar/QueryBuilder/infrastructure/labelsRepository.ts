import { invariant } from '../domain/helpers/invariant';
import { Suggestions } from '../domain/types';
import { CacheClient } from './http/CacheClient';
import { PyroscopeApiClient } from './http/PyroscopeApiClient';
import { QueryBuilderHttpRepository } from './QueryBuilderHttpRepository';

class LabelsRepository extends QueryBuilderHttpRepository<PyroscopeApiClient> {
  cacheClient: CacheClient;

  static isNotMetaLabelOrServiceName = (label: string) => !/^(__.+__|service_name)$/.test(label);

  static parseLabelsResponse(json: any): Suggestions {
    if (!Array.isArray(json.names)) {
      return [];
    }

    const uniqueLabels: string[] = Array.from(new Set(json.names.filter(LabelsRepository.isNotMetaLabelOrServiceName)));

    return uniqueLabels.map((label) => ({ value: label, label }));
  }

  static parseLabelValuesResponse(json: any): Suggestions {
    if (!Array.isArray(json.names)) {
      return [];
    }

    const labelValues: string[] = json.names;

    return labelValues.map((label) => ({ value: label, label }));
  }

  constructor(httpClient: PyroscopeApiClient, cacheClient: CacheClient) {
    super(httpClient);

    this.cacheClient = cacheClient;
  }

  static assertParams(query: string, from: number, until: number) {
    invariant(Boolean(query), 'Missing "query" parameter!');
    invariant(from > 0, 'Invalid "from" parameter!');
    invariant(until > 0 && until > from, 'Invalid "until" parameter!');
  }

  async listLabels(query: string, from: number, until: number): Promise<Suggestions> {
    LabelsRepository.assertParams(query, from, until);

    const labelsFromCache = this.cacheClient.get(query, from, until);
    if (labelsFromCache) {
      return labelsFromCache;
    }

    const json = await this.httpClient.fetchLabels(query, from, until);

    const labels = LabelsRepository.parseLabelsResponse(json);
    if (labels.length) {
      this.cacheClient.set([query, from, until], labels);
    }

    return labels;
  }

  async listLabelValues(labelId: string, query: string, from: number, until: number): Promise<Suggestions> {
    LabelsRepository.assertParams(query, from, until);
    invariant(Boolean(labelId), 'Missing label id!');

    const labelValuesFromCache = this.cacheClient.get(labelId, query, from, until);
    if (labelValuesFromCache) {
      return labelValuesFromCache;
    }

    const json = await this.httpClient.fetchLabelValues(labelId, query, from, until);

    const labelValues = LabelsRepository.parseLabelValuesResponse(json);
    if (labelValues.length) {
      this.cacheClient.set([labelId, query, from, until], labelValues);
    }

    return labelValues;
  }
}

const cacheClient = new CacheClient();
const pyroscopeApiClient = new PyroscopeApiClient();

export const labelsRepository = new LabelsRepository(pyroscopeApiClient, cacheClient);
