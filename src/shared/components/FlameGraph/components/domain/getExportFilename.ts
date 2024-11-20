import { dateTimeParse, TimeRange } from '@grafana/data';

import { CompareTarget } from '../../../../../pages/ProfilesExplorerView/components/SceneExploreDiffFlameGraph/domain/types';

type DateParts = {
  year: string;
  month: string;
  day: string;
  hour: string;
  minute: string;
  second: string;
};

const DATETIME_FORMATTER = new Intl.DateTimeFormat('fr-CA', {
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour12: false,
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
});

function format(date: Date): string {
  const parts = DATETIME_FORMATTER.formatToParts(date).reduce((acc, { type, value }) => {
    acc[type as keyof DateParts] = value;
    return acc;
  }, {} as DateParts);

  return `${parts.year}-${parts.month}-${parts.day}_${parts.hour}${parts.minute}`;
}

function dateForExportFilename(timeRange: TimeRange) {
  const from = new Date(Math.round(timeRange.from.unix() * 1000));
  const to = new Date(Math.round(timeRange.to.unix() * 1000));

  return `${format(from)}-to-${format(to)}`;
}

function getTimeRange(target: CompareTarget) {
  const [fromKey, toKey] = target === CompareTarget.BASELINE ? ['diffFrom', 'diffTo'] : ['diffFrom-2', 'diffTo-2'];

  const searchParams = new URLSearchParams(window.location.search);
  const from = searchParams.get(fromKey) as string;
  const to = searchParams.get(toKey) as string;

  return {
    raw: { from, to },
    from: dateTimeParse(from),
    to: dateTimeParse(to),
  };
}

export function getExportFilename(appName?: string) {
  const timeRanges = [
    'baseline',
    dateForExportFilename(getTimeRange(CompareTarget.BASELINE)),
    'comparison',
    dateForExportFilename(getTimeRange(CompareTarget.COMPARISON)),
  ];

  return appName ? [appName, ...timeRanges].join('_') : ['flamegraph', ...timeRanges].join('_');
}
