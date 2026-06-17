import { getEnvironment } from '../getEnvironment';

describe('getEnvironment()', () => {
  test.each([
    // edge cases
    [undefined, null],
    ['unknownhost', null],
    // local
    ['localhost', 'local'],
    // dev
    ['grafana-dev.net', 'dev'],
    ['test.grafana-dev.net', 'dev'],
    // ops
    ['foobar.grafana-ops.net', 'ops'],
    ['grafana-ops.net', 'ops'],
    // prod
    ['foobar.grafana.net', 'prod'],
    ['grafana.net', 'prod'],
  ])('when the host is "%s" → %s', (host, expectedEnvironment) => {
    setWindowLocation({ host });

    expect(getEnvironment()).toBe(expectedEnvironment);
  });
});
