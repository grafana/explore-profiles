import { useEffect, useRef } from 'react';
import { Prism } from '@pyroscope/util/prism';
import { Query } from 'grafana-pyroscope/public/app/models/query';
import { TextAreaSize } from './useResizeTextarea';

export function useHighlightQuery(query: Query, textAreaSize: TextAreaSize) {
  const codeRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (Prism && codeRef.current) {
      Prism.highlightElement(codeRef.current);
    }
  }, [query, textAreaSize]);

  return codeRef;
}
