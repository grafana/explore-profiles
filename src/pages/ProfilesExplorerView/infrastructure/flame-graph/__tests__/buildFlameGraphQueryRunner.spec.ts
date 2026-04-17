import { buildFlameGraphQueryRunner } from '../buildFlameGraphQueryRunner';

jest.mock('../../withPreventInvalidQuery', () => ({
  withPreventInvalidQuery: (runner: any) => runner,
}));

function getLabelSelector(runner: any): string {
  return runner.state.queries[0].labelSelector;
}

describe('buildFlameGraphQueryRunner', () => {
  describe('extraFilterVariables', () => {
    it('appends extraFilterVariables to the label selector', () => {
      const runner = buildFlameGraphQueryRunner({
        extraFilterVariables: ['filtersAllServices'],
      });

      expect(getLabelSelector(runner)).toBe('{service_name="$serviceName",$filters$filtersAllServices}');
    });

    it('appends multiple extraFilterVariables', () => {
      const runner = buildFlameGraphQueryRunner({
        extraFilterVariables: ['filtersAllServices', 'filtersOther'],
      });

      expect(getLabelSelector(runner)).toBe('{service_name="$serviceName",$filters$filtersAllServices,$filtersOther}');
    });

    it('does not append anything when extraFilterVariables is undefined', () => {
      const runner = buildFlameGraphQueryRunner({});

      expect(getLabelSelector(runner)).toBe('{service_name="$serviceName",$filters}');
    });

    it('does not append anything when extraFilterVariables is empty', () => {
      const runner = buildFlameGraphQueryRunner({
        extraFilterVariables: [],
      });

      expect(getLabelSelector(runner)).toBe('{service_name="$serviceName",$filters}');
    });
  });
});
