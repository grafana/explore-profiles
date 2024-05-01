import { useHistory } from 'react-router-dom';

import { PLUGIN_BASE_URL } from '../../../constants';

export function useUrlSearchParams() {
  const history = useHistory();

  return {
    // we don't use useLocation() for performance reasons: it would take too long to update after calling history.push()
    // and multiple history.push() would occur instead of a single one (e.g. happens when no params are present in the URL)
    searchParams: new URLSearchParams(window.location.search),
    pushNewUrl: (newParams: Record<string, string>) => {
      const newSearchParams = new URLSearchParams(window.location.search);

      for (const [key, value] of Object.entries(newParams)) {
        newSearchParams.set(key, value);
      }

      const pathname = trimPrefixUntil(window.location.pathname, PLUGIN_BASE_URL);
      history.push({ pathname, search: newSearchParams.toString() });
    },
  };
}

/** Trims all leading characters from a string until the pattern is reached. */
export function trimPrefixUntil(s: string, pattern: string): string {
  if (pattern === '') {
    return s;
  }

  const idx = s.indexOf(pattern);
  if (idx < 0) {
    return s;
  }

  return s.substring(idx);
}
