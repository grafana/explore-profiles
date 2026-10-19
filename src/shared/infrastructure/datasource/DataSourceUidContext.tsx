import React, { createContext, ReactNode, useContext } from 'react';

import { useDefaultDataSourceUid } from './useDefaultDataSourceUid';

export interface DataSourceUidState {
  uid: string | undefined;
  loading: boolean;
  error: Error | undefined;
}

const DataSourceUidContext = createContext<string | undefined>(undefined);

interface DataSourceUidProviderProps {
  uid: string;
  children: ReactNode;
}

export function DataSourceUidProvider({ uid, children }: DataSourceUidProviderProps) {
  return <DataSourceUidContext.Provider value={uid}>{children}</DataSourceUidContext.Provider>;
}

export function useDataSourceUid(): DataSourceUidState {
  const contextUid = useContext(DataSourceUidContext);

  return useDefaultDataSourceUid({ selectedUid: contextUid });
}
