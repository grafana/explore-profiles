import { RawTimeRange } from '@grafana/data';
import { GrafanaPyroscopeDataQuery } from '@grafana/schema/dist/esm/raw/composable/grafanapyroscope/dataquery/x/GrafanaPyroscopeDataQuery_types.gen';

import { buildURL } from './links';

describe('buildURL - Original Functionality', () => {
  const mockDatasource = {
    type: 'grafana-pyroscope-datasource',
    uid: 'test-pyroscope-uid',
  };

  const mockTimeRange: RawTimeRange = {
    from: 'now-1h',
    to: 'now',
  };

  describe('basic URL building', () => {
    it('should build URL with datasource and profile type only', () => {
      const pyroscopeQuery: GrafanaPyroscopeDataQuery = {
        refId: 'A',
        datasource: mockDatasource,
        profileTypeId: 'process_cpu:cpu:nanoseconds:cpu:nanoseconds',
        labelSelector: '{}',
        groupBy: [],
      };

      const result = buildURL({
        pyroscopeQuery,
        timeRange: mockTimeRange,
      });

      expect(result).toContain('var-dataSource=test-pyroscope-uid');
      expect(result).toContain('var-profileMetricId=process_cpu%3Acpu%3Ananoseconds%3Acpu%3Ananoseconds');
      expect(result).toContain('explorationType=all');
      expect(result).toContain('from=now-1h');
      expect(result).toContain('to=now');
    });

    it('should extract service name from labelSelector', () => {
      const pyroscopeQuery: GrafanaPyroscopeDataQuery = {
        refId: 'A',
        datasource: mockDatasource,
        profileTypeId: 'process_cpu:cpu:nanoseconds:cpu:nanoseconds',
        labelSelector: '{service_name="payment-service"}',
        groupBy: [],
      };

      const result = buildURL({
        pyroscopeQuery,
        timeRange: mockTimeRange,
      });

      expect(result).toContain('var-serviceName=payment-service');
      expect(result).toContain('explorationType=labels'); // Changes to labels when service name found
    });

    it('should ignore other labels in labelSelector', () => {
      const pyroscopeQuery: GrafanaPyroscopeDataQuery = {
        refId: 'A',
        datasource: mockDatasource,
        profileTypeId: 'process_cpu:cpu:nanoseconds:cpu:nanoseconds',
        labelSelector: '{service_name="payment", region="us-east", instance="pod-1"}',
        groupBy: [],
      };

      const result = buildURL({
        pyroscopeQuery,
        timeRange: mockTimeRange,
      });

      expect(result).toContain('var-serviceName=payment');
      // Should NOT contain region or instance parameters (old behavior)
      expect(result).not.toContain('region');
      expect(result).not.toContain('instance');
    });

    it('should handle span selector', () => {
      const pyroscopeQuery: GrafanaPyroscopeDataQuery = {
        refId: 'A',
        datasource: mockDatasource,
        profileTypeId: 'process_cpu:cpu:nanoseconds:cpu:nanoseconds',
        labelSelector: '{}',
        groupBy: [],
        spanSelector: ['test-span-id'],
      };

      const result = buildURL({
        pyroscopeQuery,
        timeRange: mockTimeRange,
      });

      expect(result).toContain('var-spanSelector=test-span-id');
    });

    it('should handle missing time range gracefully', () => {
      const pyroscopeQuery: GrafanaPyroscopeDataQuery = {
        refId: 'A',
        datasource: mockDatasource,
        profileTypeId: 'process_cpu:cpu:nanoseconds:cpu:nanoseconds',
        labelSelector: '{}',
        groupBy: [],
      };

      const result = buildURL({
        pyroscopeQuery,
      });

      expect(result).not.toContain('from=');
      expect(result).not.toContain('to=');
    });

    it('should override exploration type when explicitly provided', () => {
      const pyroscopeQuery: GrafanaPyroscopeDataQuery = {
        refId: 'A',
        datasource: mockDatasource,
        profileTypeId: 'process_cpu:cpu:nanoseconds:cpu:nanoseconds',
        labelSelector: '{service_name="payment-service"}',
        groupBy: [],
      };

      const result = buildURL({
        pyroscopeQuery,
        timeRange: mockTimeRange,
        explorationType: 'flame-graph',
      });

      expect(result).toContain('explorationType=flame-graph');
    });

    it('should handle missing span selector gracefully', () => {
      const pyroscopeQuery: GrafanaPyroscopeDataQuery = {
        refId: 'A',
        datasource: mockDatasource,
        profileTypeId: 'process_cpu:cpu:nanoseconds:cpu:nanoseconds',
        labelSelector: '{}',
        groupBy: [],
        spanSelector: [],
      };

      const result = buildURL({
        pyroscopeQuery,
        timeRange: mockTimeRange,
      });

      expect(result).not.toContain('var-spanSelector');
    });
  });
});
