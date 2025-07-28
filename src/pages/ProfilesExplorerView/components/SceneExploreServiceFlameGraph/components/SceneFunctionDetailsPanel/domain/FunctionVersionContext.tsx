import React, { createContext, ReactNode, useContext } from 'react';
import { useLocalStorage } from 'react-use';

import { FunctionVersion } from './types/FunctionDetails';

type OverridesStorage = Record<string, Record<string, FunctionVersion>>;

/**
 * Indicates how function version was defined
 */
export enum FunctionVersionOrigin {
  // provided manually by the user
  USER = 'user',
  // retrieved from profile labels
  LABELS = 'labels',
}

interface FunctionVersionContextType {
  saveOverride: (datasourceUid: string, serviceName: string, version: FunctionVersion) => void;
  deleteOverride: (datasourceUid: string, serviceName: string) => void;
  deleteAllOverrides: () => void;
  getFunctionVersion: (
    datasourceUid: string,
    serviceName: string,
    defaultVersion?: FunctionVersion
  ) => {
    functionVersion: FunctionVersion | undefined;
    functionVersionOrigin: FunctionVersionOrigin | undefined;
  };
}

const FunctionVersionContext = createContext<FunctionVersionContextType | undefined>(undefined);

interface FunctionVersionProviderProps {
  children: ReactNode;
}

export function FunctionVersionProvider({ children }: FunctionVersionProviderProps) {
  const [overrides, setOverrides] = useLocalStorage<OverridesStorage>(
    'grafana-pyroscope-app.functionDetailsOverrides',
    {}
  );

  const saveOverride = (datasourceUid: string, serviceName: string, version: FunctionVersion) => {
    setOverrides((overrides) => {
      if (!overrides) {
        overrides = {};
      }
      if (!overrides[datasourceUid]) {
        overrides[datasourceUid] = {};
      }
      overrides[datasourceUid][serviceName] = {
        ...version,
      };
      return overrides;
    });
  };

  const deleteOverride = (datasourceUid: string, serviceName: string) => {
    setOverrides((overrides) => {
      if (!overrides || !overrides[datasourceUid] || !overrides[datasourceUid][serviceName]) {
        return overrides;
      }
      delete overrides[datasourceUid][serviceName];
      return overrides;
    });
  };

  const deleteAllOverrides = () => {
    setOverrides({});
  };

  const getFunctionVersion = (datasourceUid: string, serviceName: string, defaultVersion?: FunctionVersion) => {
    const overriddenVersion = overrides?.[datasourceUid]?.[serviceName];

    let functionVersionOrigin: FunctionVersionOrigin | undefined;
    if (overriddenVersion) {
      functionVersionOrigin = FunctionVersionOrigin.USER;
    } else if (defaultVersion) {
      functionVersionOrigin = FunctionVersionOrigin.LABELS;
    }

    return {
      functionVersion: overriddenVersion || defaultVersion,
      functionVersionOrigin,
    };
  };

  const value: FunctionVersionContextType = {
    saveOverride,
    deleteOverride,
    deleteAllOverrides,
    getFunctionVersion,
  };

  return <FunctionVersionContext.Provider value={value}>{children}</FunctionVersionContext.Provider>;
}

export function useFunctionVersionContext(): FunctionVersionContextType {
  const context = useContext(FunctionVersionContext);
  if (context === undefined) {
    throw new Error('useFunctionVersionContext must be used within a FunctionVersionProvider');
  }
  return context;
}

export function useFunctionVersion(datasourceUid: string, serviceName: string, version: FunctionVersion | undefined) {
  const { saveOverride, deleteOverride, deleteAllOverrides, getFunctionVersion } = useFunctionVersionContext();

  const { functionVersion, functionVersionOrigin } = getFunctionVersion(datasourceUid, serviceName, version);

  return {
    saveOverride,
    deleteOverride,
    deleteAllOverrides,
    functionVersion,
    functionVersionOrigin,
  };
}
