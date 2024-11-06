export type Environment = 'local' | 'dev' | 'ops' | 'prod';

const MATCHERS: Array<{ regExp: RegExp; environment: Environment }> = [
  {
    regExp: /localhost/,
    environment: 'local',
  },
  {
    regExp: /grafana-dev\.net/,
    environment: 'dev',
  },
  {
    regExp: /grafana-ops\.net/,
    environment: 'ops',
  },
  {
    regExp: /grafana\.net/,
    environment: 'prod',
  },
];

export function getEnvironment(): Environment | null {
  if (!window?.location?.host) {
    return null;
  }

  const found = MATCHERS.find(({ regExp }) => regExp.test(window.location.host));

  return found ? found.environment : null;
}
