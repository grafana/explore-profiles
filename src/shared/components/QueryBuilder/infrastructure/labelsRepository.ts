import { MemoryCacheClient } from '../../../infrastructure/MemoryCacheClient';
import { invariant } from '../domain/helpers/invariant';
import { Suggestions } from '../domain/types';
import { LabelsApiClient } from './http/LabelsApiClient';
import { QueryBuilderHttpRepository } from './QueryBuilderHttpRepository';

class LabelsRepository extends QueryBuilderHttpRepository<LabelsApiClient> {
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

  constructor(httpClient: LabelsApiClient, cacheClient: MemoryCacheClient) {
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

    const labelsFromCacheP = this.cacheClient.get([query, from, until]);
    if (labelsFromCacheP) {
      const json = await labelsFromCacheP;
      const labels = LabelsRepository.parseLabelsResponse(json);

      if (!labels.length) {
        this.cacheClient.delete([query, from, until]);
      }

      return labels;
    }

    const fetchP = this.httpClient.fetchLabels(query, from, until);
    this.cacheClient.set([query, from, until], fetchP);

    try {
      const json = await fetchP;
      return LabelsRepository.parseLabelsResponse(json);
    } catch (error) {
      this.cacheClient.delete([query, from, until]);
      throw error;
    }
  }

  async listLabelValues(labelId: string, query: string, from: number, until: number): Promise<Suggestions> {
    LabelsRepository.assertParams(query, from, until);
    invariant(Boolean(labelId), 'Missing label id!');

    const labelValuesFromCacheP = this.cacheClient.get([labelId, query, from, until]);
    if (labelValuesFromCacheP) {
      const json = await labelValuesFromCacheP;
      const labelValues = LabelsRepository.parseLabelsResponse(json);

      if (!labelValues.length) {
        this.cacheClient.delete([labelId, query, from, until]);
      }

      return labelValues;
    }

    const fetchP = this.httpClient.fetchLabelValues(labelId, query, from, until);
    this.cacheClient.set([labelId, query, from, until], fetchP);

    try {
      const json = await fetchP;
      return LabelsRepository.parseLabelValuesResponse(json);
    } catch (error) {
      this.cacheClient.delete([labelId, query, from, until]);
      throw error;
    }
  }
}

export const labelsRepository = new LabelsRepository(new LabelsApiClient(), new MemoryCacheClient());
