import { useCallback, useEffect, useState } from 'react';

function parseQueryFromUrl() {
  const searchParams = new URLSearchParams(document.location.search);
  return searchParams.get('query') || '';
}

export function useQueryFromUrl(): [string, (newQuery: string) => void] {
  const [query, setInternalQuery] = useState(parseQueryFromUrl());

  const setQuery = useCallback((newQuery: string) => {
    const newUrl = new URL(document.location.toString());
    const searchParams = new URLSearchParams(newUrl.search);

    searchParams.set('query', newQuery);
    newUrl.search = searchParams.toString();

    history.pushState(null, '', newUrl.toString());
  }, []);

  const onChangeHistory = useCallback(() => {
    setInternalQuery(parseQueryFromUrl());
  }, []);

  useEffect(() => {
    window.addEventListener('popstate', onChangeHistory);
    window.addEventListener('pushstate', onChangeHistory);
    window.addEventListener('replacestate', onChangeHistory);

    return () => {
      window.removeEventListener('replacestate', onChangeHistory);
      window.removeEventListener('pushstate', onChangeHistory);
      window.removeEventListener('popstate', onChangeHistory);
    };
  }, [onChangeHistory]);

  return [query, setQuery];
}
