import { renderHook } from '@testing-library/react';
import React, { ReactNode } from 'react';

import { DataSourceUidProvider, useDataSourceUid } from '../DataSourceUidContext';
import { useSelectDefaultDataSourceUid } from '../useSelectDefaultDataSourceUid';

jest.mock('../useSelectDefaultDataSourceUid', () => ({
  useSelectDefaultDataSourceUid: jest.fn(),
}));

const useSelectDefaultDataSourceUidMock = jest.mocked(useSelectDefaultDataSourceUid);

describe('useDataSourceUid()', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    useSelectDefaultDataSourceUidMock.mockReturnValue({ loading: true, value: undefined, error: undefined });
  });

  it('should return the provider uid', () => {
    const wrapper = ({ children }: { children: ReactNode }) => (
      <DataSourceUidProvider uid="pyroscope-abc">{children}</DataSourceUidProvider>
    );

    const { result } = renderHook(() => useDataSourceUid(), { wrapper });

    expect(result.current.uid).toBe('pyroscope-abc');
  });

  it('should resolve the default uid when there is no provider', () => {
    useSelectDefaultDataSourceUidMock.mockReturnValue({ loading: false, value: 'pyroscope-def' });

    const { result } = renderHook(() => useDataSourceUid());

    expect(result.current.uid).toBe('pyroscope-def');
  });
});
