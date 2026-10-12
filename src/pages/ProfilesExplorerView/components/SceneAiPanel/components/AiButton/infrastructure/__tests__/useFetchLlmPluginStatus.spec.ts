import { BackendSrv, isAppPluginEnabled, isAppPluginInstalled, setBackendSrv } from '@grafana/runtime';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import React from 'react';

import { useFetchLlmPluginStatus } from '../useFetchLlmPluginStatus';

jest.mock('@grafana/runtime', () => ({
  ...jest.requireActual('@grafana/runtime'),
  isAppPluginInstalled: jest.fn(),
  isAppPluginEnabled: jest.fn(),
}));

jest.mock('@shared/infrastructure/tracking/logger');

const isAppPluginInstalledMock = jest.mocked(isAppPluginInstalled);
const isAppPluginEnabledMock = jest.mocked(isAppPluginEnabled);

class HttpError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });
  const Wrapper = ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children);
  Wrapper.displayName = 'TestQueryClientWrapper';
  return Wrapper;
};

describe('useFetchLlmPluginStatus()', () => {
  let backendSrvMock: BackendSrv;
  beforeEach(() => {
    jest.resetAllMocks();
    backendSrvMock = {
      chunked: jest.fn(),
      delete: jest.fn(),
      fetch: jest.fn(),
      get: jest.fn(),
      patch: jest.fn(),
      post: jest.fn(),
      put: jest.fn(),
      datasourceRequest: jest.fn(),
      request: jest.fn(),
    };
    setBackendSrv(backendSrvMock);
    isAppPluginInstalledMock.mockResolvedValue(false);
    isAppPluginEnabledMock.mockResolvedValue(false);
  });

  describe('when the Grafana LLM app is not installed', () => {
    it('does not call the settings endpoint and returns isEnabled=false', async () => {
      const { result } = renderHook(() => useFetchLlmPluginStatus(), { wrapper: createWrapper() });

      await waitFor(() => {
        expect(result.current.isFetching).toBe(false);
      });

      expect(isAppPluginEnabledMock).not.toHaveBeenCalled();
      expect(backendSrvMock.get).not.toHaveBeenCalled();
      expect(result.current.isEnabled).toBe(false);
      expect(result.current.error).toBeFalsy();
    });
  });

  describe('when the Grafana LLM app is installed', () => {
    beforeEach(() => {
      isAppPluginInstalledMock.mockResolvedValue(true);
    });

    it('returns isEnabled=true when settings.enabled and the health check reports a configured, ok provider', async () => {
      isAppPluginEnabledMock.mockResolvedValue(true);
      backendSrvMock.get = jest.fn().mockResolvedValueOnce({
        details: { llmProvider: { configured: true, ok: true } },
      });

      const { result } = renderHook(() => useFetchLlmPluginStatus(), { wrapper: createWrapper() });

      await waitFor(() => {
        expect(result.current.isEnabled).toBe(true);
      });

      expect(isAppPluginEnabledMock).toHaveBeenCalledWith('grafana-llm-app');
      expect(backendSrvMock.get).toHaveBeenCalledWith('/api/plugins/grafana-llm-app/health', undefined, undefined, {
        showErrorAlert: false,
        showSuccessAlert: false,
      });
    });

    it('returns isEnabled=false without calling the health endpoint when settings.enabled is false', async () => {
      const { result } = renderHook(() => useFetchLlmPluginStatus(), { wrapper: createWrapper() });

      await waitFor(() => {
        expect(result.current.isFetching).toBe(false);
      });

      expect(result.current.isEnabled).toBe(false);
      expect(isAppPluginEnabledMock).toHaveBeenCalledTimes(1);
      expect(backendSrvMock.get).toHaveBeenCalledTimes(0);
    });

    it('returns isEnabled=false when the health check reports the provider is not configured/ok', async () => {
      isAppPluginEnabledMock.mockResolvedValue(true);
      backendSrvMock.get = jest.fn().mockResolvedValueOnce({
        details: { llmProvider: { configured: false, ok: false } },
      });

      const { result } = renderHook(() => useFetchLlmPluginStatus(), { wrapper: createWrapper() });

      await waitFor(() => {
        expect(result.current.isFetching).toBe(false);
      });

      expect(result.current.isEnabled).toBe(false);
      expect(isAppPluginEnabledMock).toHaveBeenCalledTimes(1);
      expect(backendSrvMock.get).toHaveBeenCalledTimes(1);
    });

    it('returns isEnabled=false, without an error or toast, when the health endpoint returns a 403 (Access Denied)', async () => {
      isAppPluginEnabledMock.mockResolvedValue(true);
      backendSrvMock.get = jest.fn().mockRejectedValueOnce(new HttpError(403, 'Access Denied'));

      const { result } = renderHook(() => useFetchLlmPluginStatus(), { wrapper: createWrapper() });

      await waitFor(() => {
        expect(result.current.isFetching).toBe(false);
      });

      expect(result.current.isEnabled).toBe(false);
      expect(result.current.error).toBeFalsy();
      expect(isAppPluginEnabledMock).toHaveBeenCalledTimes(1);
      expect(backendSrvMock.get).toHaveBeenCalledTimes(1);
      expect(backendSrvMock.get).toHaveBeenCalledWith(
        '/api/plugins/grafana-llm-app/health',
        undefined,
        undefined,
        expect.objectContaining({ showErrorAlert: false, showSuccessAlert: false })
      );
    });
  });
});
