import { renderHook, waitFor } from '@testing-library/react';

import { createDataSourceUidWrapper } from '../../datasource/testing/createDataSourceUidWrapper';
import { mockFetch } from '../../http/testing/mockFetch';
import { useFetchRecordingRules } from '../useFetchRecordingRules';

describe('useFetchRecordingRules()', () => {
  it('should fetch recording rules from the context datasource', async () => {
    const fetch = mockFetch();

    renderHook(() => useFetchRecordingRules(), { wrapper: createDataSourceUidWrapper('pyroscope-abc') });

    await waitFor(() =>
      expect(fetch).toHaveBeenCalledWith(
        '/api/datasources/proxy/uid/pyroscope-abc/settings.v1.RecordingRulesService/ListRecordingRules',
        expect.anything()
      )
    );
  });

  it('should not fetch recording rules without a datasource uid', () => {
    mockFetch();

    const { result } = renderHook(() => useFetchRecordingRules(), { wrapper: createDataSourceUidWrapper('') });

    expect(result.current.isFetching).toBe(false);
  });
});
