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

export const useFunctionVersion = (
  datasourceUid: string,
  serviceName: string,
  version: FunctionVersion | undefined
  // eslint-disable-next-line sonarjs/cognitive-complexity
) => {
  const [overrides, setOverrides] = useLocalStorage<OverridesStorage>('functionDetailsOverrides', {});

  let functionVersionOrigin;
  if (overrides?.[datasourceUid]?.[serviceName]) {
    functionVersionOrigin = FunctionVersionOrigin.USER;
  } else if (version) {
    functionVersionOrigin = FunctionVersionOrigin.LABELS;
  }

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
    functionVersion: overrides?.[datasourceUid]?.[serviceName] || version,
    functionVersionOrigin,
  };
};
