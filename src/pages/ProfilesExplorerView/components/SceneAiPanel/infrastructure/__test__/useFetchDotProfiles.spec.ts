import { dateTime } from '@grafana/data';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import React from 'react';

import { useFetchDotProfiles } from '../useFetchDotProfiles';

// Mock the dependencies
jest.mock('../../../../infrastructure/profiles/ProfileApiClient');
jest.mock('../../../../infrastructure/series/http/DataSourceProxyClientBuilder');
jest.mock('../cleanupDotResponse', () => ({
  cleanupDotResponse: jest.fn((response) => response),
}));

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

describe('useFetchDotProfiles', () => {
  const dataSourceUid = 'test-datasource-uid';
  const profileMetricId = 'process_cpu:cpu:nanoseconds:cpu:nanoseconds';

  describe('time range validation', () => {
    it('should not fetch when time ranges have zero from value', () => {
      const fetchParams = [
        {
          query: '{service_name="test"}',
          timeRange: {
            from: dateTime(0), // Zero value
            to: dateTime(Date.now()),
            raw: { from: 'now-1h', to: 'now' },
          },
        },
      ];

      const { result } = renderHook(() => useFetchDotProfiles(false, fetchParams, dataSourceUid, profileMetricId), {
        wrapper: createWrapper(),
      });

      // Should not be fetching because time range is invalid
      expect(result.current.isFetching).toBe(false);
      expect(result.current.profiles).toEqual([]);
      expect(result.current.validationError).toBeDefined();
      expect(result.current.validationError?.message).toContain('Invalid time range');
    });

    it('should not fetch when time ranges have zero to value', () => {
      const fetchParams = [
        {
          query: '{service_name="test"}',
          timeRange: {
            from: dateTime(Date.now() - 3600000),
            to: dateTime(0), // Zero value
            raw: { from: 'now-1h', to: 'now' },
          },
        },
      ];

      const { result } = renderHook(() => useFetchDotProfiles(false, fetchParams, dataSourceUid, profileMetricId), {
        wrapper: createWrapper(),
      });

      expect(result.current.isFetching).toBe(false);
      expect(result.current.profiles).toEqual([]);
      expect(result.current.validationError).toBeDefined();
      expect(result.current.validationError?.message).toContain('Invalid time range');
    });

    it('should not fetch when diff mode has one time range with zero values', () => {
      const fetchParams = [
        {
          query: '{service_name="baseline"}',
          timeRange: {
            from: dateTime(Date.now() - 7200000),
            to: dateTime(Date.now() - 3600000),
            raw: { from: 'now-2h', to: 'now-1h' },
          },
        },
        {
          query: '{service_name="comparison"}',
          timeRange: {
            from: dateTime(0), // Zero value
            to: dateTime(0), // Zero value
            raw: { from: 'now-1h', to: 'now' },
          },
        },
      ];

      const { result } = renderHook(() => useFetchDotProfiles(true, fetchParams, dataSourceUid, profileMetricId), {
        wrapper: createWrapper(),
      });

      expect(result.current.isFetching).toBe(false);
      expect(result.current.profiles).toEqual([]);
      expect(result.current.validationError).toBeDefined();
      expect(result.current.validationError?.message).toContain('Invalid time range');
    });

    it('should fetch when time ranges have valid non-zero values', async () => {
      const fetchParams = [
        {
          query: '{service_name="test"}',
          timeRange: {
            from: dateTime(Date.now() - 3600000), // Valid non-zero value
            to: dateTime(Date.now()), // Valid non-zero value
            raw: { from: 'now-1h', to: 'now' },
          },
        },
      ];

      const { result } = renderHook(() => useFetchDotProfiles(false, fetchParams, dataSourceUid, profileMetricId), {
        wrapper: createWrapper(),
      });

      // No validation error for valid time ranges
      expect(result.current.validationError).toBeUndefined();

      // Initially should be fetching (or will start fetching)
      await waitFor(() => {
        // The query should have been enabled and attempted
        // We expect either isFetching to be true or an error to occur due to mocked dependencies
        expect(result.current.isFetching || result.current.fetchError).toBeTruthy();
      });
    });

    it('should fetch when diff mode has both valid time ranges', async () => {
      const fetchParams = [
        {
          query: '{service_name="baseline"}',
          timeRange: {
            from: dateTime(Date.now() - 7200000), // Valid non-zero value
            to: dateTime(Date.now() - 3600000), // Valid non-zero value
            raw: { from: 'now-2h', to: 'now-1h' },
          },
        },
        {
          query: '{service_name="comparison"}',
          timeRange: {
            from: dateTime(Date.now() - 3600000), // Valid non-zero value
            to: dateTime(Date.now()), // Valid non-zero value
            raw: { from: 'now-1h', to: 'now' },
          },
        },
      ];

      const { result } = renderHook(() => useFetchDotProfiles(true, fetchParams, dataSourceUid, profileMetricId), {
        wrapper: createWrapper(),
      });

      // No validation error for valid time ranges
      expect(result.current.validationError).toBeUndefined();

      // The query should have been enabled and attempted
      await waitFor(() => {
        expect(result.current.isFetching || result.current.fetchError).toBeTruthy();
      });
    });
  });

  describe('fetch params validation', () => {
    it('should return validation error when diff mode receives wrong number of params', () => {
      const fetchParams = [
        {
          query: '{service_name="test"}',
          timeRange: {
            from: dateTime(Date.now() - 3600000),
            to: dateTime(Date.now()),
            raw: { from: 'now-1h', to: 'now' },
          },
        },
      ];

      const { result } = renderHook(
        () => useFetchDotProfiles(true, fetchParams, dataSourceUid, profileMetricId), // isDiff=true but only 1 param
        { wrapper: createWrapper() }
      );

      expect(result.current.validationError).toBeDefined();
      expect(result.current.validationError?.message).toContain('Invalid number of fetch parameters');
    });

    it('should return validation error when non-diff mode receives wrong number of params', () => {
      const fetchParams = [
        {
          query: '{service_name="baseline"}',
          timeRange: {
            from: dateTime(Date.now() - 7200000),
            to: dateTime(Date.now() - 3600000),
            raw: { from: 'now-2h', to: 'now-1h' },
          },
        },
        {
          query: '{service_name="comparison"}',
          timeRange: {
            from: dateTime(Date.now() - 3600000),
            to: dateTime(Date.now()),
            raw: { from: 'now-1h', to: 'now' },
          },
        },
      ];

      const { result } = renderHook(
        () => useFetchDotProfiles(false, fetchParams, dataSourceUid, profileMetricId), // isDiff=false but 2 params
        { wrapper: createWrapper() }
      );

      expect(result.current.validationError).toBeDefined();
      expect(result.current.validationError?.message).toContain('Invalid number of fetch parameters');
    });
  });
});
