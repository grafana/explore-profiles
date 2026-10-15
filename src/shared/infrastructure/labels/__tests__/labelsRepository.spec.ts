import { MemoryCacheClient } from '@shared/infrastructure/MemoryCacheClient';

import { LabelsApiClient } from '../LabelsApiClient';
import { labelsRepository } from '../labelsRepository';

const params = { query: '{service_name="svc"}', from: 1700000000000, to: 1700000600000 };
const valuesParams = { ...params, label: 'region' };

function buildApiClient(dataSourceUid: string) {
  return {
    getBaseUrl: async () => `/api/datasources/proxy/uid/${dataSourceUid}`,
    fetchLabels: jest.fn().mockResolvedValue({ names: [dataSourceUid] }),
    fetchLabelValues: jest.fn().mockResolvedValue({ names: [dataSourceUid] }),
  } as unknown as LabelsApiClient;
}

describe('labelsRepository', () => {
  beforeEach(() => {
    labelsRepository.setCacheClient(new MemoryCacheClient());
  });

  describe('listLabels', () => {
    it('should fetch once while a previous base URL lookup is in flight', async () => {
      const apiClient = buildApiClient('pyro-a');
      labelsRepository.setApiClient(apiClient);

      await Promise.all([labelsRepository.listLabels(params), labelsRepository.listLabels(params)]);

      expect(apiClient.fetchLabels).toHaveBeenCalledTimes(1);
    });

    it('should return data from the data source selected while a previous base URL lookup is in flight', async () => {
      labelsRepository.setApiClient(buildApiClient('pyro-a'));
      const resultA = labelsRepository.listLabels(params);

      labelsRepository.setApiClient(buildApiClient('pyro-b'));
      const resultB = labelsRepository.listLabels(params);

      const [, labels] = await Promise.all([resultA, resultB]);

      expect(labels).toEqual([{ value: 'pyro-b', label: 'pyro-b' }]);
    });
  });

  describe('listLabelValues', () => {
    it('should fetch once while a previous base URL lookup is in flight', async () => {
      const apiClient = buildApiClient('pyro-a');
      labelsRepository.setApiClient(apiClient);

      await Promise.all([
        labelsRepository.listLabelValues(valuesParams),
        labelsRepository.listLabelValues(valuesParams),
      ]);

      expect(apiClient.fetchLabelValues).toHaveBeenCalledTimes(1);
    });

    it('should return data from the data source selected while a previous base URL lookup is in flight', async () => {
      labelsRepository.setApiClient(buildApiClient('pyro-a'));
      const resultA = labelsRepository.listLabelValues(valuesParams);

      labelsRepository.setApiClient(buildApiClient('pyro-b'));
      const resultB = labelsRepository.listLabelValues(valuesParams);

      const [, values] = await Promise.all([resultA, resultB]);

      expect(values).toEqual([{ value: 'pyro-b', label: 'pyro-b' }]);
    });
  });
});
