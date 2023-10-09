import { renderHook } from '@testing-library/react-hooks';
import { setBackendSrv, getBackendSrv } from '@grafana/runtime';
import { Observable } from 'rxjs';

import { usePluginSettingsApiClient } from '../usePluginSettingsApiClient';
import plugin from './fixtures/plugin.json';

describe('usePluginSettingsApiClient(plugin)', () => {
  it('returns a settings API client', () => {
    // @ts-expect-error
    const { result } = renderHook(() => usePluginSettingsApiClient(plugin));

    expect(result.current.settingsApiClient).toEqual({
      update: expect.any(Function),
    });
  });

  describe('the settings API client', () => {
    describe('async update(meta)', () => {
      it('performs a POST request to the settings endpoint', async () => {
        // @ts-expect-error
        setBackendSrv({
          fetch: jest.fn(
            () =>
              new Observable((o) => {
                // @ts-expect-error
                o.next({});
                o.complete();
              })
          ),
        });

        // @ts-expect-error
        const { result } = renderHook(() => usePluginSettingsApiClient(plugin));

        const { settingsApiClient } = result.current;

        await settingsApiClient.update({
          jsonData: {
            basicAuthUser: 'grafakus',
          },
        });

        expect(getBackendSrv().fetch).toHaveBeenCalledWith({
          url: `/api/plugins/${plugin.meta.id}/settings`,
          method: 'POST',
          data: expect.objectContaining({
            jsonData: expect.objectContaining({
              basicAuthUser: 'grafakus',
            }),
          }),
        });
      });
    });
  });
});
