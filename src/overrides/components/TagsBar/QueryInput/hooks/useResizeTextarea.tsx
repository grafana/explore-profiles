import { useState, useEffect, useRef } from 'react';
import { useWindowWidth } from '@react-hook/window-size/throttled';
import { Query } from 'grafana-pyroscope/public/app/models/query';

export type TextAreaSize = {
  width: number;
  height: number;
};

// Throttled useWindowWidth & leading = true seem to improve the issue where
// Colored & non-colored code are out of sync in the UI
// TODO: Use something similar to https://github.com/grafana/grafana/blob/a851750b1c9b4d8aa6743dcf935a990be115173c/public/app/plugins/datasource/prometheus/components/monaco-query-field/MonacoQueryField.tsx
export function useResizeTextarea(query: Query) {
  const textAreaRef = useRef<HTMLTextAreaElement>(null);
  const [textAreaSize, setTextAreaSize] = useState<TextAreaSize>({ width: 0, height: 0 });
  const windowWidth = useWindowWidth({ leading: true });

  useEffect(() => {
    setTextAreaSize({
      width: textAreaRef?.current?.offsetWidth || 0,
      height: textAreaRef?.current?.offsetHeight || 0,
    });
  }, [query, windowWidth]);

  return { textAreaSize, textAreaRef };
}
