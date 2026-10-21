import { DataSourceUidProvider } from '@shared/infrastructure/datasource/DataSourceUidContext';
import { DataSourceUidFallback } from '@shared/infrastructure/datasource/DataSourceUidFallback';
import { useDefaultDataSourceUid } from '@shared/infrastructure/datasource/useDefaultDataSourceUid';
import React from 'react';

export function WithDataSourceUid({ children }: React.PropsWithChildren) {
  const dataSourceState = useDefaultDataSourceUid();

  if (!dataSourceState.uid) {
    return <DataSourceUidFallback dataSourceState={dataSourceState} />;
  }

  return <DataSourceUidProvider uid={dataSourceState.uid}>{children}</DataSourceUidProvider>;
}
