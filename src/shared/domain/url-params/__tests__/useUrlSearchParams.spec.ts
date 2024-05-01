import { trimPrefixUntil } from '../useUrlSearchParams';

describe('trimPrefixUntil', () => {
  const cases = [
    {
      name: 'empty string',
      s: '',
      pattern: '',
      expected: '',
    },
    {
      name: 'no pattern',
      s: 'some text',
      pattern: '',
      expected: 'some text',
    },
    {
      name: 'pattern not found',
      s: 'some text',
      pattern: 'does not exist',
      expected: 'some text',
    },
    {
      name: 'pattern not found in empty string',
      s: '',
      pattern: 'does not exist',
      expected: '',
    },
    {
      name: 'has no leading characters before pattern',
      s: 'some text',
      pattern: 'some text',
      expected: 'some text',
    },
    {
      name: 'has leading characters before pattern',
      s: 'trimmed some text',
      pattern: 'some text',
      expected: 'some text',
    },
    {
      name: 'has leading characters before pattern and trailing characters after pattern',
      s: 'trimmed some text',
      pattern: 'some',
      expected: 'some text',
    },
    {
      name: 'has leading characters before pattern and trailing whitespace characters after pattern',
      s: 'trimmed \r\n\t some text \r\n\t',
      pattern: 'some',
      expected: 'some text \r\n\t',
    },
    {
      name: 'matches first instance of pattern',
      s: 'trimmed some text some text some text some text some text',
      pattern: 'some text',
      expected: 'some text some text some text some text some text',
    },
    {
      name: 'can strip preceding url path',
      s: '/grafana/a/grafana-pyroscope-app/single',
      pattern: '/a/grafana-pyroscope-app',
      expected: '/a/grafana-pyroscope-app/single',
    },
  ];

  it.each(cases)('$name', ({ s, pattern, expected }) => {
    const got = trimPrefixUntil(s, pattern);
    expect(got).toEqual(expected);
  });
});
