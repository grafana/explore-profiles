import { useCallback, useEffect, useState } from 'react';

function parseQueryFromUrl() {
  const searchParams = new URLSearchParams(document.location.search);
  return searchParams.get('query') || '';
}

export function useUserQuery(): [string, (newQuery: string) => void] {
  const [query, setInternalQuery] = useState(parseQueryFromUrl());

  const setQuery = useCallback((newQuery: string) => {
    setInternalQuery(newQuery);

    const newUrl = new URL(document.location.toString());
    const searchParams = new URLSearchParams(newUrl.search);

    searchParams.set('query', newQuery);
    newUrl.search = searchParams.toString();

    history.pushState(null, '', newUrl.toString());
  }, []);

  const onPopState = useCallback(() => {
    setInternalQuery(parseQueryFromUrl());
  }, []);

  useEffect(() => {
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, [onPopState]);

  return [query, setQuery];
}
