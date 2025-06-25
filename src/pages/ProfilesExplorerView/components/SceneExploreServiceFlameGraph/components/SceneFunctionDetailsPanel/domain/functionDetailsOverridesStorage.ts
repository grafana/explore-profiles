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
    overrides: overrides?.[datasourceUid]?.[serviceName] || version,
  };
};

// export const saveOverrides = (datasourceUid: string, serviceName: string, version: FunctionVersion) => {
//   const overrides = JSON.parse(localStorage.getItem('functionDetailsOverrides') || '{}');
//
//   if (!overrides[datasourceUid]) {
//     overrides[datasourceUid] = {};
//   }
//
//   overrides[datasourceUid][serviceName] = {
//     ...version,
//     custom: true
//   };
//
//   localStorage.setItem('functionDetailsOverrides', JSON.stringify(overrides));
// }
//
// export const deleteOverride = (datasourceUid: string, serviceName: string) => {
//     const overrides = JSON.parse(localStorage.getItem('functionDetailsOverrides') || '{}');
//
//     if (overrides[datasourceUid] && overrides[datasourceUid][serviceName]) {
//         delete overrides[datasourceUid][serviceName];
//         localStorage.setItem('functionDetailsOverrides', JSON.stringify(overrides));
//     }
// }
//
// export const deleteAllOverrides = () => {
//     localStorage.removeItem('functionDetailsOverrides');
// }
//
// export const getOverrides = (datasourceUid: string, serviceName: string): FunctionVersion | undefined => {
//   const overrides = JSON.parse(localStorage.getItem('functionDetailsOverrides') || '{}');
//   return overrides[datasourceUid]?.[serviceName];
// }
