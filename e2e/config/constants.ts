import 'dotenv/config';
import path from 'path';

type EnvVars = {
  E2E_BASE_URL: string;
  E2E_USERNAME: string;
  E2E_PASSWORD: string;
};

function getEnvVars(): EnvVars {
  const envVars = ['E2E_BASE_URL', 'E2E_USERNAME', 'E2E_PASSWORD'].reduce((acc, name: string) => {
    acc[name] = process.env[name];
    return acc;
  }, {} as EnvVars);

  if (!envVars.E2E_BASE_URL) {
    throw new Error('Missing E2E_BASE_URL environment variable!');
  }

  return envVars;
}

export const ENV_VARS = getEnvVars();

export const DEFAULT_URL_PARAMS = ENV_VARS.E2E_BASE_URL.startsWith('http://localhost')
  ? new URLSearchParams({
      // We use static data in local and PR build (where the host is http://localhost):
      query: 'process_cpu:cpu:nanoseconds:cpu:nanoseconds{service_name="ride-sharing-app"}',
      from: '1710352800', // 2024-03-13 19:00:00
      to: '1710355800', // 2024-03-13 19:50:00
      maxNodes: '16384',
    })
  : new URLSearchParams();

export const DEFAULT_EXPLORE_PROFILES_URL_PARAMS = ENV_VARS.E2E_BASE_URL.startsWith('http://localhost')
  ? new URLSearchParams({
      // We use static data in local and PR build (where the host is http://localhost):
      from: '2024-03-13T18:00:00.000Z',
      to: '2024-03-13T18:50:00.000Z',
      maxNodes: '16384',
    })
  : new URLSearchParams();

export const AUTH_FILE = path.join(process.cwd(), 'e2e', 'auth', 'user.json');
