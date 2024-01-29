import userStorage from '../../../../shared/infrastructure/UserStorage';
import { determineDefaultApp } from '../determineDefaultApp';

jest.mock('../../../../shared/infrastructure/UserStorage');

// For safety, we keep integration tests here instead of strict unit tests

describe('async determineDefaultApp(apps)', () => {
  describe('when the user settings contain a default app', () => {
    it('should return the first "cpu app" that matches the default app', async () => {
      // @ts-expect-error
      userStorage.get.mockResolvedValue({
        defaultApp: 'ride-sharing-app',
      });

      const apps = [
        {
          name: 'pyroscope',
          __profile_type__: 'block:contentions:count::',
        },
        {
          name: 'nodejs-app',
          __profile_type__: 'process_cpu:cpu:nanoseconds:cpu:nanoseconds',
        },
        {
          name: 'ride-sharing-app',
          __profile_type__: 'memory:alloc_space:bytes::',
        },
        {
          name: 'ride-sharing-app',
          __profile_type__: 'process_cpu:cpu:nanoseconds:cpu:nanoseconds',
        },
      ];

      const result = await determineDefaultApp(apps);

      expect(result).toBe(apps[3]);
    });

    describe('if no "cpu app" is found', () => {
      it('should return the first ".itimer app" that matches the default app', async () => {
        // @ts-expect-error
        userStorage.get.mockResolvedValue({
          defaultApp: 'ride-sharing-app',
        });

        const apps = [
          {
            name: 'pyroscope',
            __profile_type__: 'block:contentions:count::',
          },
          {
            name: 'nodejs-app',
            __profile_type__: 'foo:.itimer:bar',
          },
          {
            name: 'ride-sharing-app',
            __profile_type__: 'memory:alloc_space:bytes::',
          },
          {
            name: 'ride-sharing-app',
            __profile_type__: 'foo:.itimer:bar',
          },
        ];

        const result = await determineDefaultApp(apps);

        expect(result).toBe(apps[3]);
      });
    });

    describe('otherwise', () => {
      it('it should return the first app that matches the default app', async () => {
        // @ts-expect-error
        userStorage.get.mockResolvedValue({
          defaultApp: 'ride-sharing-app',
        });

        const apps = [
          {
            name: 'pyroscope',
            __profile_type__: 'block:contentions:count::',
          },
          {
            name: 'ride-sharing-app',
            __profile_type__: 'memory:alloc_space:bytes::',
          },
        ];

        const result = await determineDefaultApp(apps);

        expect(result).toBe(apps[1]);
      });
    });
  });

  describe('when the user settings does not contain a default app', () => {
    it('should return the first "cpu app"', async () => {
      // @ts-expect-error
      userStorage.get.mockResolvedValue(null);

      const apps = [
        {
          name: 'pyroscope',
          __profile_type__: 'block:contentions:count::',
        },
        {
          name: 'nodejs-app',
          __profile_type__: 'process_cpu:cpu:nanoseconds:cpu:nanoseconds',
        },
        {
          name: 'ride-sharing-app',
          __profile_type__: 'memory:alloc_space:bytes::',
        },
        {
          name: 'ride-sharing-app',
          __profile_type__: 'process_cpu:cpu:nanoseconds:cpu:nanoseconds',
        },
      ];

      const result = await determineDefaultApp(apps);

      expect(result).toBe(apps[1]);
    });

    describe('if no "cpu app" is found', () => {
      it('should return the first ".itimer app"', async () => {
        // @ts-expect-error
        userStorage.get.mockResolvedValue(null);

        const apps = [
          {
            name: 'pyroscope',
            __profile_type__: 'block:contentions:count::',
          },
          {
            name: 'nodejs-app',
            __profile_type__: 'foo:.itimer:bar',
          },
          {
            name: 'ride-sharing-app',
            __profile_type__: 'memory:alloc_space:bytes::',
          },
          {
            name: 'ride-sharing-app',
            __profile_type__: 'foo:.itimer:bar',
          },
        ];

        const result = await determineDefaultApp(apps);

        expect(result).toBe(apps[1]);
      });
    });

    describe('otherwise', () => {
      it('it should return the first app', async () => {
        // @ts-expect-error
        userStorage.get.mockResolvedValue(null);

        const apps = [
          {
            name: 'pyroscope',
            __profile_type__: 'block:contentions:count::',
          },
          {
            name: 'ride-sharing-app',
            __profile_type__: 'memory:alloc_space:bytes::',
          },
        ];

        const result = await determineDefaultApp(apps);

        expect(result).toBe(apps[0]);
      });
    });
  });
});
