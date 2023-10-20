import { useEffect, useRef } from 'react';
import { Prism } from '@pyroscope/util/prism';
import { Query } from 'grafana-pyroscope/public/app/models/query';
import { TextareaSize } from './useResizeTextarea';

export function useHighlightQuery(query: Query, textareaSize: TextareaSize) {
  const codeRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (Prism && codeRef.current) {
      Prism.highlightElement(codeRef.current);
    }
  }, [query, textareaSize]);

  return codeRef;
}
