import 'dotenv/config';
import path from 'path';

type EnvVars = {
  E2E_BASE_URL: string;
  E2E_USERNAME: string;
  E2E_PASSWORD: string;
};

function getEnvVars(): EnvVars {
  const envVars = ['E2E_BASE_URL', 'E2E_USERNAME', 'E2E_PASSWORD'].reduce((acc, name: string) => {
    const value = process.env[name];

    if (!value) {
      console.warn('The "%s" environment variable is empty! Is it intended?', name);
    }

    acc[name] = value;

    return acc;
  }, {});

  return envVars as EnvVars;
}

export const ENV_VARS = getEnvVars();

export const AUTH_FILE = path.join(process.cwd(), 'e2e', 'auth', 'user.json');
