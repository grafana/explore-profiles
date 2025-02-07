import { CollectorRules } from '@shared/infrastructure/settings/CollectorRules';
import { useFetchCollectorRules } from '@shared/infrastructure/settings/useFetchCollectorRules';
import { act, renderHook } from '@testing-library/react';

import { useCollectorSettings } from '../useCollectorSettings';

// appEvents dependency
const appEvents = {
  publish: jest.fn(),
};

jest.mock('@grafana/runtime', () => ({
  ...jest.requireActual('@grafana/runtime'),
  getAppEvents: () => appEvents,
}));

const noRules = () => [] as CollectorRules;

const sampleRule = () =>
  [
    {
      rule: {
        name: 'existing-rule',
        services: [
          { name: 'my-service', enabled: true },
          { name: 'other-service', enabled: false },
        ],
        java: { enabled: true },
        ebpf: { enabled: false },
      },
      modified: false,
    },
  ] as CollectorRules;

jest.mock('@shared/infrastructure/settings/useFetchCollectorRules', () => ({
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

      expect(result.current.data.rules).toEqual({ data: [] });
      expect(result.current.data.fetchError).toEqual(null);
      expect(result.current.actions.getRule).toEqual(expect.any(Function));
    });
    /*

    describe('actions.addRule()', () => {
      it('adds the expected rule with defaults', () => {
        const { result } = renderHook(() => useCollectorSettings());

        const { data, actions } = result.current;

        expect(data.data.length).toBe(0);

        act(() => {
          actions.addRule('my-rule');
        });

        expect(result.current.data.data.length).toBe(1);
        expect(result.current.data.data[0]).toStrictEqual({
          rule: {
            name: 'my-rule',
            services: [],
            java: { enabled: true },
            ebpf: { enabled: true },
          },
          modified: true,
        });
      });
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

      expect(result.current.data.data.rules.length).toEqual(1);
      expect(result.current.data.fetchError).toEqual(null);
      expect(result.current.actions.getRule('existing-rule')).toEqual({
        modified: false,
        rule: {
          java: { enabled: true },
          ebpf: { enabled: false },
          name: 'existing-rule',
          services: [
            { enabled: true, name: 'my-service' },
            { enabled: false, name: 'other-service' },
          ],
        },
      });
    });
    describe('actions.updateServiceEnabled()', () => {
      it('adds new enabled service', () => {
        const { result } = renderHook(() => useCollectorSettings());

        const { actions } = result.current;

        act(() => {
          actions.updateServiceEnabled('existing-rule', 'my-new-service', true);
        });

        expect(result.current.data.data.length).toBe(1);
        expect(result.current.data.data[0].rule.services).toEqual([
          { name: 'my-service', enabled: true },
          { name: 'other-service', enabled: false },
          { name: 'my-new-service', enabled: true },
        ]);
      });
      it('updates existing services', () => {
        const { result } = renderHook(() => useCollectorSettings());

        const { actions } = result.current;

        act(() => {
          actions.updateServiceEnabled('existing-rule', 'my-service', false);
          actions.updateServiceEnabled('existing-rule', 'other-service', true);
        });

        expect(result.current.data.data.length).toBe(1);
        expect(result.current.data.data[0].rule.services).toEqual([
          { name: 'my-service', enabled: false },
          { name: 'other-service', enabled: true },
        ]);
      });
    });
    describe('actions.updateEBPFCollectionEnabled()', () => {
      it('it enables ebpf', () => {
        const { result } = renderHook(() => useCollectorSettings());

        const { actions } = result.current;

        act(() => {
          actions.updateEBPFCollectionEnabled('existing-rule', true);
        });

        expect(result.current.data.data.length).toBe(1);
        expect(result.current.data.data[0].rule.ebpf).toEqual({ enabled: true });
      });
      it('it disables ebpf', () => {
        const { result } = renderHook(() => useCollectorSettings());

        const { actions } = result.current;

        act(() => {
          actions.updateEBPFCollectionEnabled('existing-rule', false);
        });

        expect(result.current.data.data.length).toBe(1);
        expect(result.current.data.data[0].rule.ebpf).toEqual({ enabled: false });
      });
    });
    describe('actions.updateJavaCollectionEnabled()', () => {
      it('it enables java', () => {
        const { result } = renderHook(() => useCollectorSettings());

        const { actions } = result.current;

        act(() => {
          actions.updateJavaCollectionEnabled('existing-rule', true);
        });

        expect(result.current.data.data.length).toBe(1);
        expect(result.current.data.data[0].rule.java).toEqual({ enabled: true });
      });
      it('it disables java', () => {
        const { result } = renderHook(() => useCollectorSettings());

        const { actions } = result.current;

        act(() => {
          actions.updateJavaCollectionEnabled('existing-rule', false);
        });

        expect(result.current.data.data.length).toBe(1);
        expect(result.current.data.data[0].rule.java).toEqual({ enabled: false });
      });
    });
    describe('actions.saveRule()', () => {
      const mockMutate = jest.fn();
      beforeEach(() => {
        mockMutate.mockReset();
        mockMutate.mockImplementation((...args) => {
          mockMutate.mock.calls.push(args);
          return {
            configuration: '// mock',
            generation: 1234,
            lastUpdated: 666,
          };
        });
        mockRules.mockReturnValue({
          error: null,
          rules: sampleRule(),
          mutate: mockMutate,
        });
      });
      it('it saves a modified rule', async () => {
        const { result } = renderHook(() => useCollectorSettings());

        const { actions } = result.current;

        await act(async () => {
          // add new service
          actions.updateServiceEnabled('existing-rule', 'my-new-service', true);

          // toggle my service
          actions.updateServiceEnabled('existing-rule', 'my-service', false);

          // toggle collection from java to ebpf
          actions.updateEBPFCollectionEnabled('existing-rule', true);
          actions.updateJavaCollectionEnabled('existing-rule', false);

          await actions.saveRule('existing-rule');
        });

        expect(mockMutate).toHaveBeenCalledWith({
          name: 'existing-rule',
          ebpf: { enabled: true },
          java: { enabled: false },
          services: [
            { name: 'my-service', enabled: false },
            { name: 'other-service', enabled: false },
            { name: 'my-new-service', enabled: true },
          ],
        });
        expect(result.current.data.data.length).toBe(1);
        expect(result.current.data.data[0].rule.configuration).toEqual('// mock');
        expect(result.current.data.data[0].rule.generation).toEqual(1234);
        expect(result.current.data.data[0].rule.lastUpdated).toEqual(666);
      });
    });
            */
  });
});
