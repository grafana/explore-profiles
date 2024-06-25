import { AbstractRepository } from '../../../infrastructure/AbstractRepository';
import { invariant } from '../domain/helpers/invariant';
import { Suggestions } from '../domain/types';
import { LabelsApiClient } from './http/LabelsApiClient';
import { MemoryCacheClient } from './http/MemoryCacheClient';

type ListLabelsOptions = {
  query: string;
  from: number;
  until: number;
};

type ListLabelValuesOptions = ListLabelsOptions & {
  label: string;
};

class LabelsRepository extends AbstractRepository<LabelsApiClient> {
  cacheClient: MemoryCacheClient;

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

  constructor(options: { apiClient: LabelsApiClient; cacheClient: MemoryCacheClient }) {
    super({ apiClient: options.apiClient });

    this.cacheClient = options.cacheClient;
  }

  setApiClient(apiClient: LabelsApiClient) {
    this.apiClient = apiClient;
  }

  static assertParams(query: string, from: number, until: number) {
    invariant(Boolean(query), 'Missing "query" parameter!');
    invariant(from > 0, 'Invalid "from" parameter!');
    invariant(until > 0 && until > from, 'Invalid "until" parameter!');
  }

  async listLabels({ query, from, until }: ListLabelsOptions): Promise<Suggestions> {
    LabelsRepository.assertParams(query, from, until);

    const cacheParams = [this.apiClient!.baseUrl, query, from, until];

    const labelsFromCacheP = this.cacheClient.get(cacheParams);
    if (labelsFromCacheP) {
      const json = await labelsFromCacheP;
      const labels = LabelsRepository.parseLabelsResponse(json);

      if (!labels.length) {
        this.cacheClient.delete(cacheParams);
      }

      return labels;
    }

    const fetchP = this.apiClient!.fetchLabels(query, from, until);
    this.cacheClient.set(cacheParams, fetchP);

    try {
      const json = await fetchP;
      return LabelsRepository.parseLabelsResponse(json);
    } catch (error) {
      this.cacheClient.delete(cacheParams);
      throw error;
    }
  }

  async listLabelValues({ label, query, from, until }: ListLabelValuesOptions): Promise<Suggestions> {
    LabelsRepository.assertParams(query, from, until);
    invariant(Boolean(label), 'Missing label value!');

    const cacheParams = [this.apiClient!.baseUrl, label, query, from, until];

    const labelValuesFromCacheP = this.cacheClient.get(cacheParams);
    if (labelValuesFromCacheP) {
      const json = await labelValuesFromCacheP;
      const labelValues = LabelsRepository.parseLabelsResponse(json);

      if (!labelValues.length) {
        this.cacheClient.delete(cacheParams);
      }

      return labelValues;
    }

    const fetchP = this.apiClient!.fetchLabelValues(label, query, from, until);
    this.cacheClient.set(cacheParams, fetchP);

    try {
      const json = await fetchP;
      return LabelsRepository.parseLabelValuesResponse(json);
    } catch (error) {
      this.cacheClient.delete(cacheParams);
      throw error;
    }
  }
}

export const labelsRepository = new LabelsRepository({
  apiClient: new LabelsApiClient(),
  cacheClient: new MemoryCacheClient(),
});
