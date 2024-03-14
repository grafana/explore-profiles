import { getRelativeTimeString } from './getRelativeTimeString';

const DTF = new Intl.DateTimeFormat('en-US', {
  year: 'numeric',
  month: 'long',
  day: '2-digit',
});

export function formatCommitDate(commitDate?: Date) {
  return commitDate ? `${DTF.format(commitDate)} (${getRelativeTimeString(commitDate)})` : '?';
}
