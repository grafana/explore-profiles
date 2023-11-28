import { invariant } from '../domain/helpers/invariant';
import { Suggestions } from '../domain/types';
import { QueryBuilderHttpRepository } from './QueryBuilderHttpRepository';
import { CacheClient } from './http/CacheClient';
import { PyroscopeApiClient } from './http/PyroscopeApiClient';

class LabelsRepository extends QueryBuilderHttpRepository<PyroscopeApiClient> {
  cacheClient: CacheClient;

  static isNotMetaLabelOrServiceName = (label: string) => !/^(__.+__|service_name)$/.test(label);

  static async parseLabelsResponse(response: Response): Promise<Suggestions> {
    const json = await response.json();
    if (!Array.isArray(json.names)) {
      return [];
    }

    const uniqueLabels: string[] = Array.from(new Set(json.names.filter(LabelsRepository.isNotMetaLabelOrServiceName)));

    return uniqueLabels.map((label) => ({ value: label, label }));
  }

  static async parseLabelValuesResponse(response: Response): Promise<Suggestions> {
    const json = await response.json();
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

    const response = await this.httpClient.fetchLabels(query, from, until);

    const labels = await LabelsRepository.parseLabelsResponse(response);

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

    const response = await this.httpClient.fetchLabelValues(labelId, query, from, until);

    const labelValues = await LabelsRepository.parseLabelValuesResponse(response);

    if (labelValues.length) {
      this.cacheClient.set([labelId, query, from, until], labelValues);
    }

    return labelValues;
  }
}

const cacheClient = new CacheClient();
const pyroscopeApiClient = new PyroscopeApiClient();

export const labelsRepository = new LabelsRepository(pyroscopeApiClient, cacheClient);
