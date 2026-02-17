import { act, renderHook } from '@testing-library/react';
import React, { ReactNode } from 'react';

import { FunctionVersionOrigin, FunctionVersionProvider, useFunctionVersion } from '../FunctionVersionContext';
import { FunctionVersion } from '../types/FunctionDetails';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(window, 'localStorage', { value: localStorageMock });

const wrapper = ({ children }: { children: ReactNode }) => (
  <FunctionVersionProvider>{children}</FunctionVersionProvider>
);

describe('FunctionVersionContext', () => {
  beforeEach(() => {
    localStorageMock.clear();
  });

  describe('useFunctionVersion', () => {
    const datasourceUid = 'test-datasource';
    const serviceName = 'test-service';

    describe('when no user override exists', () => {
      it('should return the default version passed to the hook', () => {
        const defaultVersion: FunctionVersion = {
          repository: 'https://github.com/test/repo',
          git_ref: 'main',
          root_path: '/src',
        };

        const { result } = renderHook(() => useFunctionVersion(datasourceUid, serviceName, defaultVersion), {
          wrapper,
        });

        expect(result.current.functionVersion).toEqual(defaultVersion);
        expect(result.current.functionVersionOrigin).toBe(FunctionVersionOrigin.LABELS);
      });

      it('should return root_path when default version has it', () => {
        const defaultVersion: FunctionVersion = {
          repository: 'https://github.com/test/repo',
          git_ref: 'abc123',
          root_path: '/custom/path',
        };

        const { result } = renderHook(() => useFunctionVersion(datasourceUid, serviceName, defaultVersion), {
          wrapper,
        });

        expect(result.current.functionVersion?.root_path).toBe('/custom/path');
      });

      it('should update functionVersion when default version changes', () => {
        const versionA: FunctionVersion = {
          repository: 'https://github.com/test/repo',
          git_ref: 'commit-a',
          root_path: '',
        };

        const versionB: FunctionVersion = {
          repository: 'https://github.com/test/repo',
          git_ref: 'commit-b',
          root_path: '/src/app',
        };

        const { result, rerender } = renderHook(
          ({ version }) => useFunctionVersion(datasourceUid, serviceName, version),
          {
            wrapper,
            initialProps: { version: versionA },
          }
        );

        expect(result.current.functionVersion?.root_path).toBe('');
        expect(result.current.functionVersion?.git_ref).toBe('commit-a');

        rerender({ version: versionB });

        expect(result.current.functionVersion?.root_path).toBe('/src/app');
        expect(result.current.functionVersion?.git_ref).toBe('commit-b');
      });
    });

    describe('when user override exists', () => {
      it('should return the user override instead of the default', () => {
        const defaultVersion: FunctionVersion = {
          repository: 'https://github.com/test/repo',
          git_ref: 'main',
          root_path: '/default/path',
        };

        const { result } = renderHook(() => useFunctionVersion(datasourceUid, serviceName, defaultVersion), {
          wrapper,
        });

        // Save a user override
        act(() => {
          result.current.saveOverride(datasourceUid, serviceName, {
            repository: 'https://github.com/custom/repo',
            git_ref: 'custom-branch',
            root_path: '/custom/override/path',
          });
        });

        expect(result.current.functionVersion?.repository).toBe('https://github.com/custom/repo');
        expect(result.current.functionVersion?.git_ref).toBe('custom-branch');
        expect(result.current.functionVersion?.root_path).toBe('/custom/override/path');
        expect(result.current.functionVersionOrigin).toBe(FunctionVersionOrigin.USER);
      });

      it('should use empty root_path from override when user explicitly clears it', () => {
        const defaultVersion: FunctionVersion = {
          repository: 'https://github.com/test/repo',
          git_ref: 'main',
          root_path: '/default/path',
        };

        const { result } = renderHook(() => useFunctionVersion(datasourceUid, serviceName, defaultVersion), {
          wrapper,
        });

        // User saves override with empty root_path (intentional)
        act(() => {
          result.current.saveOverride(datasourceUid, serviceName, {
            repository: 'https://github.com/test/repo',
            git_ref: 'main',
            root_path: '', // User explicitly cleared root_path
          });
        });

        // Override should take precedence, even with empty root_path
        expect(result.current.functionVersion?.root_path).toBe('');
        expect(result.current.functionVersionOrigin).toBe(FunctionVersionOrigin.USER);
      });
    });

    describe('deleteOverride', () => {
      it('should remove override and fall back to default version', () => {
        const defaultVersion: FunctionVersion = {
          repository: 'https://github.com/test/repo',
          git_ref: 'main',
          root_path: '/default/path',
        };

        const { result } = renderHook(() => useFunctionVersion(datasourceUid, serviceName, defaultVersion), {
          wrapper,
        });

        // Save then delete override
        act(() => {
          result.current.saveOverride(datasourceUid, serviceName, {
            repository: 'https://github.com/custom/repo',
            git_ref: 'custom',
            root_path: '/custom/path',
          });
        });

        expect(result.current.functionVersionOrigin).toBe(FunctionVersionOrigin.USER);

        act(() => {
          result.current.deleteOverride(datasourceUid, serviceName);
        });

        // Should fall back to default
        expect(result.current.functionVersion).toEqual(defaultVersion);
        expect(result.current.functionVersionOrigin).toBe(FunctionVersionOrigin.LABELS);
      });
    });
  });
});
