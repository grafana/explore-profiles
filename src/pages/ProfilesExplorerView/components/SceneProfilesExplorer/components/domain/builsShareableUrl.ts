import { dateMath } from '@grafana/data';

export function builsShareableUrl(): URL {
  const shareableUrl = new URL(window.location.toString());
  const { searchParams } = shareableUrl;

  ['from', 'to', 'from-2', 'to-2', 'from-3', 'to-3', 'diffFrom', 'diffTo', 'diffFrom-2', 'diffTo-2'].forEach((name) => {
    const value = searchParams.get(name);
    if (value) {
      searchParams.set(name, String(dateMath.parse(value)!.valueOf()));
    }
  });

  return shareableUrl;
}
