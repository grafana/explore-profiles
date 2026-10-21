import { useDataSourceUid } from '@shared/infrastructure/datasource/DataSourceUidContext';
import { useSelectDefaultDataSourceUid } from '@shared/infrastructure/datasource/useSelectDefaultDataSourceUid';
import { render, screen } from '@testing-library/react';
import React from 'react';

import { WithDataSourceUid } from '../WithDataSourceUid';

jest.mock('@shared/infrastructure/datasource/useSelectDefaultDataSourceUid', () => ({
  useSelectDefaultDataSourceUid: jest.fn(),
}));

const useSelectDefaultDataSourceUidMock = jest.mocked(useSelectDefaultDataSourceUid);

const ShowUid = () => <>{useDataSourceUid().uid}</>;

describe('WithDataSourceUid', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    useSelectDefaultDataSourceUidMock.mockReturnValue({ loading: true, value: undefined, error: undefined });
  });

  it('should show a placeholder while the datasource resolves', () => {
    render(
      <WithDataSourceUid>
        <ShowUid />
      </WithDataSourceUid>
    );

    expect(screen.getByText('Selecting datasource...')).toBeInTheDocument();
  });

  it('should show the selection error', () => {
    useSelectDefaultDataSourceUidMock.mockReturnValue({ loading: false, error: new Error('Datasource not found') });

    render(
      <WithDataSourceUid>
        <ShowUid />
      </WithDataSourceUid>
    );

    expect(screen.getByText('Datasource not found')).toBeInTheDocument();
  });

  it('should provide the resolved uid to its children', () => {
    useSelectDefaultDataSourceUidMock.mockReturnValue({ loading: false, value: 'pyroscope-abc' });

    render(
      <WithDataSourceUid>
        <ShowUid />
      </WithDataSourceUid>
    );

    expect(screen.getByText('pyroscope-abc')).toBeInTheDocument();
  });
});
