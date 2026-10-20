import { renderHook, waitFor } from '@testing-library/react';

import { createDataSourceUidWrapper } from '../../datasource/testing/createDataSourceUidWrapper';
import { mockFetch } from '../../http/testing/mockFetch';
import { useFetchPluginSettings } from '../useFetchPluginSettings';

describe('useFetchPluginSettings()', () => {
  it('should fetch settings from the context datasource', async () => {
    const fetch = mockFetch();

    renderHook(() => useFetchPluginSettings(), { wrapper: createDataSourceUidWrapper('pyroscope-abc') });

    await waitFor(() =>
      expect(fetch).toHaveBeenCalledWith(
        '/api/datasources/proxy/uid/pyroscope-abc/settings.v1.SettingsService/Get',
        expect.anything()
      )
    );
  });

  it('should not fetch settings without a datasource uid', () => {
    mockFetch();

    const { result } = renderHook(() => useFetchPluginSettings(), { wrapper: createDataSourceUidWrapper('') });

    expect(result.current.isFetching).toBe(false);
  });
});
