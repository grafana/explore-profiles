import { readFileSync } from 'fs';
import path from 'path';

import { PprofProfile } from '../../../shared/domain/Profile';
import PprofData from './testdata/pprof.json';
import { CallSite, FunctionDetails, parsePprof } from './vcs';

jest.mock('@grafana/runtime', () => ({ config: { appUrl: 'https://localhost:3000/' } }));

function getPprofData(): PprofProfile {
  return PprofData;
}

function getCode(): string {
  const filePath = path.join(__dirname, './testdata/netpoll_kqueue.go');
  return btoa(readFileSync(filePath, 'utf-8'));
}

test('parsePprof', () => {
  expect(parsePprof('runtime.netpoll', getPprofData())).toEqual(
    new Array<FunctionDetails>(
      new FunctionDetails(
        'runtime.netpoll',
        '{"repository":"github.com/grafana/pyroscope","git_ref":"main"}',
        121,
        '/usr/local/Cellar/go/1.21.3/libexec/src/runtime/netpoll_kqueue.go',
        new Map<number, CallSite>([
          [168, { line: 168, cum: 140000000, flat: 0 }],
          [121, { line: 121, cum: 10000000, flat: 10000000 }],
          [141, { line: 141, cum: 4520000000, flat: 0 }],
          [126, { line: 126, cum: 10000000, flat: 10000000 }],
        ]),
        'nanoseconds'
      )
    )
  );
});

test('codeMapping', () => {
  expect(
    new FunctionDetails(
      'runtime.netpoll',
      '{"repository":"github.com/grafana/pyroscope","git_ref":"main"}',
      121,
      '/usr/local/Cellar/go/1.21.3/libexec/src/runtime/netpoll_kqueue.go',
      new Map<number, CallSite>([
        [121, { line: 121, cum: 10000000, flat: 10000000 }],
        [123, { line: 123, cum: 4520000000, flat: 0 }],
        [126, { line: 126, cum: 10000000, flat: 10000000 }],
      ]),
      'nanoseconds'
    ).Map(getCode())
  ).toEqual({
    unit: 'nanoseconds',
    lines: [
      {
        cum: 0,
        flat: 0,
        line: '',
        number: 116,
      },
      {
        cum: 0,
        flat: 0,
        line: '// netpoll checks for ready network connections.',
        number: 117,
      },
      {
        cum: 0,
        flat: 0,
        line: '// Returns list of goroutines that become runnable.',
        number: 118,
      },
      {
        cum: 0,
        flat: 0,
        line: '// delay < 0: blocks indefinitely',
        number: 119,
      },
      {
        cum: 0,
        flat: 0,
        line: '// delay == 0: does not block, just polls',
        number: 120,
      },
      {
        cum: 10000000,
        flat: 10000000,
        line: '// delay > 0: block for up to that many nanoseconds',
        number: 121,
      },
      {
        cum: 0,
        flat: 0,
        line: 'func netpoll(delay int64) gList {',
        number: 122,
      },
      {
        cum: 4520000000,
        flat: 0,
        line: '	if kq == -1 {',
        number: 123,
      },
      {
        cum: 0,
        flat: 0,
        line: '		return gList{}',
        number: 124,
      },
      {
        cum: 0,
        flat: 0,
        line: '	}',
        number: 125,
      },
      {
        cum: 10000000,
        flat: 10000000,
        line: '	var tp *timespec',
        number: 126,
      },
      {
        cum: 0,
        flat: 0,
        line: '	var ts timespec',
        number: 127,
      },
      {
        cum: 0,
        flat: 0,
        line: '	if delay < 0 {',
        number: 128,
      },
      {
        cum: 0,
        flat: 0,
        line: '		tp = nil',
        number: 129,
      },
      {
        cum: 0,
        flat: 0,
        line: '	} else if delay == 0 {',
        number: 130,
      },
      {
        cum: 0,
        flat: 0,
        line: '		tp = &ts',
        number: 131,
      },
    ],
  });
});
