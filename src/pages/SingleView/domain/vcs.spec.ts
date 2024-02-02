import { readFileSync } from 'fs';
import path from 'path';

import { PprofProfile } from '../../../shared/domain/Profile';
import PprofData from './testdata/pprof.json';
import YugePprofData from './testdata/yuge.json';
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

test('parseYuge', () => {
  const funcName = 'github.com/grafana/pyroscope/pkg/phlaredb/symdb.(*PartitionWriter).convertSamples';
  const res = parsePprof(funcName, YugePprofData as PprofProfile);

  expect(res).toEqual([
    new FunctionDetails(
      funcName,
      '{"repository":"https://github.com/grafana/pyroscope","git_ref":"369ca83"}',
      107,
      '/home/runner/work/pyroscope/pyroscope/pkg/phlaredb/symdb/dedup_slice.go',
      new Map<number, CallSite>([
        [138, { cum: 27030000000, flat: 1490000000, line: 138 }],
        [143, { cum: 30700000000, flat: 0, line: 143 }],
        [152, { cum: 10500000000, flat: 0, line: 152 }],
        [136, { cum: 3560000000, flat: 400000000, line: 136 }],
        [151, { cum: 500000000, flat: 0, line: 151 }],
        [134, { cum: 1650000000, flat: 1650000000, line: 134 }],
        [120, { cum: 560000000, flat: 0, line: 120 }],
        [137, { cum: 820000000, flat: 820000000, line: 137 }],
        [142, { cum: 400000000, flat: 10000000, line: 142 }],
        [149, { cum: 70000000, flat: 70000000, line: 149 }],
        [132, { cum: 340000000, flat: 340000000, line: 132 }],
        [121, { cum: 370000000, flat: 0, line: 121 }],
        [127, { cum: 60000000, flat: 60000000, line: 127 }],
        [115, { cum: 660000000, flat: 0, line: 115 }],
        [156, { cum: 30000000, flat: 0, line: 156 }],
        [114, { cum: 420000000, flat: 150000000, line: 114 }],
        [130, { cum: 140000000, flat: 140000000, line: 130 }],
        [148, { cum: 130000000, flat: 130000000, line: 148 }],
        [133, { cum: 100000000, flat: 100000000, line: 133 }],
        [153, { cum: 30000000, flat: 30000000, line: 153 }],
        [147, { cum: 20000000, flat: 20000000, line: 147 }],
      ]),
      'nanoseconds'
    ),
  ]);
});
