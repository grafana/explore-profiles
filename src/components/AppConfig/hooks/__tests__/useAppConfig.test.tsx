import { renderHook, act } from '@testing-library/react-hooks';
import { AppEvents } from '@grafana/data';

import { useAppConfig } from '../useAppConfig';
import plugin from './fixtures/plugin.json';

// appEvents dependency
const appEvents = {
  publish: jest.fn(),
};

jest.mock('@grafana/runtime', () => ({
  ...jest.requireActual('@grafana/runtime'),
  getAppEvents: () => appEvents,
}));

// settingsApiClient dependency
const settingsApiClient = {
  update: jest.fn(async () => ({})),
};

jest.mock('../usePluginSettingsApiClient', () => ({
  usePluginSettingsApiClient: () => ({ settingsApiClient }),
}));

// window.location.reload mock
const { location } = window;

beforeEach(() => {
  Object.defineProperty(window, 'location', {
    configurable: true,
    value: { reload: jest.fn() },
  });
});

afterEach(() => {
  Object.defineProperty(window, 'location', { configurable: true, value: location });
});

// tests
describe('useAppConfig(plugin)', () => {
  it('returns an object with "data" and "actions" fields', () => {
    // @ts-expect-error
    const { result } = renderHook(() => useAppConfig(plugin));

    expect(result.current).toEqual({
      data: {
        enableFlameGraphDotComExport: false,
      },
      actions: {
        toggleEnableFlameGraphDotComExport: expect.any(Function),
        saveConfiguration: expect.any(Function),
      },
    });
  });

  describe('actions.toggleEnableFlameGraphDotComExport()', () => {
    it('toggles the value of data.enableFlameGraphDotComExport', () => {
      // @ts-expect-error
      const { result } = renderHook(() => useAppConfig(plugin));

      const { data, actions } = result.current;

      expect(data.enableFlameGraphDotComExport).toBe(false);

      act(() => {
        actions.toggleEnableFlameGraphDotComExport();
      });

      expect(result.current.data.enableFlameGraphDotComExport).toBe(true);
    });
  });

  describe('actions.saveConfiguration()', () => {
    it('uses the settingsApiClient to update the plugin settings', async () => {
      // @ts-expect-error
      const { result } = renderHook(() => useAppConfig(plugin));

      const { saveConfiguration } = result.current.actions;

      await saveConfiguration();

      expect(settingsApiClient.update).toHaveBeenCalledWith({
        jsonData: {
          enableFlameGraphDotComExport: result.current.data.enableFlameGraphDotComExport,
        },
      });
    });

    describe('after updating the plugin settings', () => {
      it('reloads the page', async () => {
        // @ts-expect-error
        const { result } = renderHook(() => useAppConfig(plugin));

        const { saveConfiguration } = result.current.actions;

        await saveConfiguration();

        expect(window.location.reload).toHaveBeenCalledWith();
      });
    });

    describe('if an error occurs while updating the plugin settings', () => {
      it(`publishes an "${AppEvents.alertError.name}" application event`, async () => {
        const updateError = new Error('Ooops! settingsApiClient.update error.');
        settingsApiClient.update.mockRejectedValue(updateError);

        // prevent console noise in the output
        jest.spyOn(console, 'error').mockImplementation(() => {});

        // @ts-expect-error
        const { result } = renderHook(() => useAppConfig(plugin));

        const { saveConfiguration } = result.current.actions;

        await saveConfiguration();

        expect(appEvents.publish).toHaveBeenCalledWith({
          type: AppEvents.alertError.name,
          payload: [
            'Error while saving the plugin configuration!',
            'Please try again later, sorry for the inconvenience.',
          ],
        });
      });
    });
  });
});
