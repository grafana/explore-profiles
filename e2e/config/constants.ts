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
      // pyroscope-rideshare-go app, cpu profile, from from `2023-11-11 08:55:00` to `2023-11-11 13:05:00`
      query: 'process_cpu:cpu:nanoseconds:cpu:nanoseconds{service_name="pyroscope-rideshare-go"}',
      from: '1699688210000',
      until: '1699705810000',
      groupBy: 'pyroscope_spy',
      groupByValue: 'All',
    }).toString()
  : '';

export const AUTH_FILE = path.join(process.cwd(), 'e2e', 'auth', 'user.json');
