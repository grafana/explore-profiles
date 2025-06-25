import { useLocalStorage } from 'react-use';

import { FunctionVersion } from './types/FunctionDetails';

type OverridesStorage = Record<string, Record<string, FunctionVersion>>;

export const useFunctionVersion = (
  datasourceUid: string,
  serviceName: string,
  version: FunctionVersion | undefined
) => {
  const [overrides, setOverrides] = useLocalStorage<OverridesStorage>('functionDetailsOverrides', {});

  return {
    saveOverride: (datasourceUid: string, serviceName: string, version: FunctionVersion) => {
      setOverrides((overrides) => {
        if (!overrides) {
          overrides = {};
        }
        if (!overrides[datasourceUid]) {
          overrides[datasourceUid] = {};
        }
        overrides[datasourceUid][serviceName] = {
          ...version,
          custom: true,
        };
        return overrides;
      });
    },
    deleteOverride: (datasourceUid: string, serviceName: string) => {
      setOverrides((overrides) => {
        if (!overrides || !overrides[datasourceUid] || !overrides[datasourceUid][serviceName]) {
          return overrides;
        }
        delete overrides[datasourceUid][serviceName];
        return overrides;
      });
    },
    deleteAllOverrides: () => {
      setOverrides({});
    },
    // CODE: rename to value? or provide each prop separately
    overrides: overrides?.[datasourceUid]?.[serviceName] || version,
    // CODE: plus info about if override was applied
  };
};
