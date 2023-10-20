import useResizeObserver from '@react-hook/resize-observer';
import { useState, useRef } from 'react';

export type TextareaSize = {
  width: number;
  height: number;
};

export function useResizeTextarea() {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [textareaSize, setTextareaSize] = useState<TextareaSize>({ width: 0, height: 0 });

  useResizeObserver(textareaRef, (entry: ResizeObserverEntry) => {
    setTextareaSize({ width: entry.borderBoxSize[0].inlineSize, height: entry.borderBoxSize[0].blockSize });
  });

  return { textareaRef, textareaSize };
}
