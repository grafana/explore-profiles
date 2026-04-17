import { buildTimeSeriesQueryRunner } from '../buildTimeSeriesQueryRunner';

jest.mock('../../withPreventInvalidQuery', () => ({
  withPreventInvalidQuery: (runner: any) => runner,
}));

function getLabelSelector(runner: any): string {
  return runner.state.queries[0].labelSelector;
}

describe('buildTimeSeriesQueryRunner', () => {
  describe('extraFilterVariables', () => {
    it('appends extraFilterVariables to the label selector', () => {
      const runner = buildTimeSeriesQueryRunner({
        serviceName: 'my-service',
        extraFilterVariables: ['filtersAllServices'],
      });

      expect(getLabelSelector(runner)).toBe('{service_name="my-service",$filters$filtersAllServices}');
    });

    it('appends multiple extraFilterVariables', () => {
      const runner = buildTimeSeriesQueryRunner({
        serviceName: 'my-service',
        extraFilterVariables: ['filtersAllServices', 'filtersOther'],
      });

      expect(getLabelSelector(runner)).toBe('{service_name="my-service",$filters$filtersAllServices,$filtersOther}');
    });

    it('does not append anything when extraFilterVariables is undefined', () => {
      const runner = buildTimeSeriesQueryRunner({
        serviceName: 'my-service',
      });

      expect(getLabelSelector(runner)).toBe('{service_name="my-service",$filters}');
    });

    it('does not append anything when extraFilterVariables is empty', () => {
      const runner = buildTimeSeriesQueryRunner({
        serviceName: 'my-service',
        extraFilterVariables: [],
      });

      expect(getLabelSelector(runner)).toBe('{service_name="my-service",$filters}');
    });
  });
});
