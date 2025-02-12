import {
  GetCollectionRuleResponse,
  UpsertCollectionRuleRequest,
} from '@buf/pyroscope_api.bufbuild_es/settings/v1/setting_pb';
import { act, renderHook } from '@testing-library/react';

import { useCollectorSettings } from '../useCollectorSettings';
import { useFetchCollectorRules } from '../useFetchCollectorRules';

// appEvents dependency
const appEvents = {
  publish: jest.fn(),
};

jest.mock('@grafana/runtime', () => ({
  ...jest.requireActual('@grafana/runtime'),
  getAppEvents: () => appEvents,
}));

const noRules = () => [] as GetCollectionRuleResponse[];

const sampleRule = () => [
  {
    name: 'existing-rule',
    services: [
      { name: 'my-service', enabled: true },
      { name: 'other-service', enabled: false },
    ],
    java: { enabled: true },
    ebpf: { enabled: false },
  } as GetCollectionRuleResponse,
];

jest.mock('../useFetchCollectorRules', () => ({
  useFetchCollectorRules: jest.fn(),
}));
const mockRules = useFetchCollectorRules as jest.Mock;

// tests
describe('useCollectorSettings()', () => {
  describe('without rules stored', () => {
    beforeEach(() => {
      mockRules.mockReturnValue({
        error: null,
        rules: noRules(),
      });
    });
    it('returns an object with "data" and "actions" fields', () => {
      const { result } = renderHook(() => useCollectorSettings());

      expect(result.current.data.rules).toEqual([]);
      expect(result.current.data.fetchError).toEqual(null);
    });
  });

  describe('with rules stored', () => {
    beforeEach(() => {
      mockRules.mockReturnValue({
        error: null,
        rules: sampleRule(),
      });
    });
    it('returns the existing rule', () => {
      const { result } = renderHook(() => useCollectorSettings());

      expect(result.current.data.rules.length).toEqual(1);
      expect(result.current.data.fetchError).toEqual(null);
      expect(result.current.data.rules[0]).toEqual({
        java: { enabled: true },
        ebpf: { enabled: false },
        name: 'existing-rule',
        services: [
          { enabled: true, name: 'my-service' },
          { enabled: false, name: 'other-service' },
        ],
      });
    });
    describe('actions.saveRule()', () => {
      const mockUpsert = jest.fn();
      beforeEach(() => {
        mockUpsert.mockReset();
        mockUpsert.mockImplementation((...args) => {
          mockUpsert.mock.calls.push(args);
          return {
            configuration: '// mock',
            generation: 1234,
            lastUpdated: 666,
          };
        });
        mockRules.mockReturnValue({
          error: null,
          rules: sampleRule(),
          upsertAsync: mockUpsert,
        });
      });
      it('it saves a modified rule', async () => {
        const { result } = renderHook(() => useCollectorSettings());

        const { actions } = result.current;

        await act(async () => {
          // add new service
          await actions.saveRule({
            name: 'existing-rule',
            ebpf: { enabled: true },
            java: { enabled: false },
            services: [
              { name: 'my-service', enabled: false },
              { name: 'other-service', enabled: false },
              { name: 'my-new-service', enabled: true },
            ],
          } as UpsertCollectionRuleRequest);
        });

        expect(mockUpsert).toHaveBeenCalledWith({
          name: 'existing-rule',
          ebpf: { enabled: true },
          java: { enabled: false },
          services: [
            { name: 'my-service', enabled: false },
            { name: 'other-service', enabled: false },
            { name: 'my-new-service', enabled: true },
          ],
        });
        expect(result.current.data.rules.length).toBe(1);
        expect(result.current.data.rules[0].configuration).toEqual('// mock');
        expect(result.current.data.rules[0].generation).toEqual(1234);
        expect(result.current.data.rules[0].lastUpdated).toEqual(666);
      });
    });
  });
});
