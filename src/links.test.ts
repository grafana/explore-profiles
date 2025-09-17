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

    it('should extract additional labels when exploration type is labels', () => {
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
      expect(result).toContain('explorationType=labels'); // Service name present, so becomes labels
      // Now extracts additional labels for labels exploration type
      expect(result).toContain('region');
      expect(result).toContain('instance');
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

    it('should use exploration type when explicitly provided', () => {
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

  describe('enhanced functionality', () => {
    it('should return base URL for datasource-only context', () => {
      const pyroscopeQuery: GrafanaPyroscopeDataQuery = {
        refId: 'A',
        datasource: mockDatasource,
        profileTypeId: '', // Empty
        labelSelector: '{}', // No service_name
        groupBy: [],
      };

      const result = buildURL({
        pyroscopeQuery,
        timeRange: mockTimeRange,
      });

      expect(result).toBe(
        '/a/grafana-pyroscope-app/explore?var-dataSource=test-pyroscope-uid&explorationType=all&from=now-1h&to=now'
      );
    });

    it('should extract additional labels for labels exploration type', () => {
      const pyroscopeQuery: GrafanaPyroscopeDataQuery = {
        refId: 'A',
        datasource: mockDatasource,
        profileTypeId: 'process_cpu:cpu:nanoseconds:cpu:nanoseconds',
        labelSelector: '{service_name="payment", region="us-east", version=~"1.2.*"}',
        groupBy: [],
      };

      const result = buildURL({
        pyroscopeQuery,
        timeRange: mockTimeRange,
        explorationType: 'labels',
      });

      expect(result).toContain('var-serviceName=payment');
      expect(result).toContain('var-filters=region%7C%3D%7Cus-east%2Cversion%7C%3D%7E%7C1.2.*');
      expect(result).toContain('explorationType=labels');
    });

    it('should handle maxNodes parameter', () => {
      const pyroscopeQuery: GrafanaPyroscopeDataQuery = {
        refId: 'A',
        datasource: mockDatasource,
        profileTypeId: 'process_cpu:cpu:nanoseconds:cpu:nanoseconds',
        labelSelector: '{}',
        groupBy: [],
        maxNodes: 8192,
      };

      const result = buildURL({
        pyroscopeQuery,
        timeRange: mockTimeRange,
      });

      expect(result).toContain('maxNodes=8192');
    });

    it('should handle multiple span selectors', () => {
      const pyroscopeQuery: GrafanaPyroscopeDataQuery = {
        refId: 'A',
        datasource: mockDatasource,
        profileTypeId: 'process_cpu:cpu:nanoseconds:cpu:nanoseconds',
        labelSelector: '{}',
        groupBy: [],
        spanSelector: ['span-1', 'span-2'],
      };

      const result = buildURL({
        pyroscopeQuery,
        timeRange: mockTimeRange,
      });

      expect(result).toContain('var-spanSelector=span-1%2Cspan-2');
    });

    it('should preserve all label operators', () => {
      const pyroscopeQuery: GrafanaPyroscopeDataQuery = {
        refId: 'A',
        datasource: mockDatasource,
        profileTypeId: 'process_cpu:cpu:nanoseconds:cpu:nanoseconds',
        labelSelector: '{service_name="api", region!="test", version=~"1.*", env!~"dev.*"}',
        groupBy: [],
      };

      const result = buildURL({
        pyroscopeQuery,
        timeRange: mockTimeRange,
        explorationType: 'labels',
      });

      const decodedUrl = decodeURIComponent(result);
      expect(decodedUrl).toContain('var-filters=region|!=|test,version|=~|1.*,env|!~|dev.*');
    });

    it('should add filters for flame-graph exploration type', () => {
      const pyroscopeQuery: GrafanaPyroscopeDataQuery = {
        refId: 'A',
        datasource: mockDatasource,
        profileTypeId: 'process_cpu:cpu:nanoseconds:cpu:nanoseconds',
        labelSelector: '{service_name="payment", region="us-east"}',
        groupBy: [],
      };

      const result = buildURL({
        pyroscopeQuery,
        timeRange: mockTimeRange,
        explorationType: 'flame-graph',
      });

      expect(result).toContain('var-serviceName=payment');
      expect(result).toContain('var-filters=region%7C%3D%7Cus-east'); // Should add filters for flame-graph too
      expect(result).toContain('explorationType=flame-graph');
    });
  });
});
