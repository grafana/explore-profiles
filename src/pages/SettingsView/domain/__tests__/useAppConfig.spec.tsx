import { AppEvents } from '@grafana/data';
import { act, renderHook } from '@testing-library/react';

import { DEFAULT_SETTINGS, useAppConfig } from '../useAppConfig';
import plugin from './fixtures/plugin.json';

// appEvents dependency
const appEvents = {
  publish: jest.fn(),
};

jest.mock('@grafana/runtime', () => ({
  ...jest.requireActual('@grafana/runtime'),
  getAppEvents: () => appEvents,
}));

// useFetchPluginSettings dependency
const mutate = jest.fn();

const defaultSettings = {
  collapsedFlamegraphs: DEFAULT_SETTINGS.COLLAPSED_FLAMEGRAPHS,
  maxNodes: DEFAULT_SETTINGS.MAX_NODES,
  enableFlameGraphDotComExport: DEFAULT_SETTINGS.ENABLE_FLAMEGRAPHDOTCOM_EXPORT,
};

jest.mock('../../infrastructure/useFetchPluginSettings', () => ({
  useFetchPluginSettings: () => ({
    settings: defaultSettings,
    error: null,
    mutate,
  }),
}));

// tests
describe('useAppConfig(plugin)', () => {
  it('returns an object with "data" and "actions" fields', () => {
    // @ts-expect-error
    const { result } = renderHook(() => useAppConfig(plugin));

    expect(result.current).toEqual({
      data: defaultSettings,
      actions: {
        toggleCollapsedFlamegraphs: expect.any(Function),
        updateMaxNodes: expect.any(Function),
        toggleEnableFlameGraphDotComExport: expect.any(Function),
        saveSettings: expect.any(Function),
      },
    });
  });

  describe('actions.toggleCollapsedFlamegraphs()', () => {
    it('toggles the value of data.collapsedFlamegraphs', () => {
      // @ts-expect-error
      const { result } = renderHook(() => useAppConfig(plugin));

      const { data, actions } = result.current;

      expect(data.collapsedFlamegraphs).toBe(defaultSettings.collapsedFlamegraphs);

      act(() => {
        actions.toggleCollapsedFlamegraphs();
      });

      expect(result.current.data.collapsedFlamegraphs).toBe(true);
    });
  });

  describe('actions.updateMaxNodes(event)', () => {
    it('updates the value of data.maxNodes', () => {
      // @ts-expect-error
      const { result } = renderHook(() => useAppConfig(plugin));

      const { data, actions } = result.current;

      expect(data.maxNodes).toBe(defaultSettings.maxNodes);

      act(() => {
        actions.updateMaxNodes({ target: { value: '42' } } as React.ChangeEvent<HTMLInputElement>);
      });

      expect(result.current.data.maxNodes).toBe(42);
    });
  });

  describe('actions.toggleEnableFlameGraphDotComExport()', () => {
    it('toggles the value of data.enableFlameGraphDotComExport', () => {
      // @ts-expect-error
      const { result } = renderHook(() => useAppConfig(plugin));

      const { data, actions } = result.current;

      expect(data.enableFlameGraphDotComExport).toBe(defaultSettings.enableFlameGraphDotComExport);

      act(() => {
        actions.toggleEnableFlameGraphDotComExport();
      });

      expect(result.current.data.enableFlameGraphDotComExport).toBe(false);
    });
  });

  describe('actions.saveSettings()', () => {
    it('stores the plugin settings', async () => {
      // @ts-expect-error
      const { result } = renderHook(() => useAppConfig(plugin));

      const { saveSettings } = result.current.actions;

      await saveSettings();

      expect(mutate).toHaveBeenCalledWith(defaultSettings);
    });

    describe('if no error occurred', () => {
      it(`publishes an "${AppEvents.alertSuccess.name}" application event`, async () => {
        mutate.mockResolvedValue({ ok: true });

        // @ts-expect-error
        const { result } = renderHook(() => useAppConfig(plugin));

        const { saveSettings } = result.current.actions;

        await saveSettings();

        expect(appEvents.publish).toHaveBeenCalledWith({
          type: AppEvents.alertSuccess.name,
          payload: ['Plugin settings successfully saved!'],
        });
      });
    });

    describe('if an error occurred', () => {
      it(`publishes an "${AppEvents.alertError.name}" application event`, async () => {
        const updateError = new Error('Ooops! settingsApiClient.update error.');
        mutate.mockRejectedValue(updateError);

        // prevent console noise in the output
        jest.spyOn(console, 'error').mockImplementation(() => {});

        // @ts-expect-error
        const { result } = renderHook(() => useAppConfig(plugin));

        const { saveSettings } = result.current.actions;

        await saveSettings();

        expect(appEvents.publish).toHaveBeenCalledWith({
          type: AppEvents.alertError.name,
          payload: ['Error while saving the plugin settings!', 'Please try again later, sorry for the inconvenience.'],
        });
      });
    });
  });
});
