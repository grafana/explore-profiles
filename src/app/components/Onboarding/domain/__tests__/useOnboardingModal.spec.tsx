import { renderHook } from '@testing-library/react';

import { useFetchInstances } from '../../infrastructure/useFetchInstances';
import { useOnboardingModal } from '../useOnboardingModal';

jest.mock('../../infrastructure/useFetchInstances', () => ({
  useFetchInstances: jest.fn(),
}));

describe('useOnboardingModal()', () => {
  describe('when no instances data is returned by useFetchInstances()', () => {
    it('returns a "sign-in" URL', () => {
      (useFetchInstances as jest.Mock).mockReturnValue({ isFetching: false, error: null, instances: undefined });

      const { result } = renderHook(() => useOnboardingModal());
      const { data } = result.current;

      expect(data.settingsUrl).toBe('https://grafana.com/auth/sign-in/');
    });
  });

  describe('when instances data is returned by useFetchInstances()', () => {
    it('returns a custom URL', () => {
      (useFetchInstances as jest.Mock).mockReturnValue({
        isFetching: false,
        error: null,
        instances: {
          orgSlug: 'marcmignonsin',
          hpInstanceId: 863122,
        },
      });

      const { result } = renderHook(() => useOnboardingModal());
      const { data } = result.current;

      expect(data.settingsUrl).toBe('https://grafana.com/orgs/marcmignonsin/hosted-profiles/863122');
    });
  });
});
