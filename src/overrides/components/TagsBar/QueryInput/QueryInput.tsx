import React from 'react';
import TextareaAutosize from 'react-textarea-autosize';
import cx from 'classnames';

import { Query } from '@pyroscope/models/query';

import styles from './QueryInput.module.scss';
import { useResizeTextarea } from './hooks/useResizeTextarea';
import { useHighlightQuery } from './hooks/useHighlightQuery';
import { useQueryInput } from './hooks/useQueryInput';
import { Button, Icon, Tooltip } from '@grafana/ui';
import { useParseQuery } from './hooks/useParseQuery';

type QueryInputProps = {
  initialQuery: Query;
  onSubmit: (query: string) => void;
};

/**
 * QueryInput refers to the input box used for queries
 */
export default function QueryInput({ initialQuery, onSubmit }: QueryInputProps) {
  const parsedQuery = useParseQuery(initialQuery);

  const { textAreaRef, textAreaSize } = useResizeTextarea(parsedQuery.query);
  const codeRef = useHighlightQuery(parsedQuery.query, textAreaSize);

  const { data, actions } = useQueryInput(parsedQuery, onSubmit);

  return (
    <>
      <Button variant="secondary" fill="outline" type="button" style={{ height: textAreaSize.height }}>
        {data.profileMetric.type}
        <Tooltip content={data.profileMetric.description} placement="bottom">
          <Icon name="info-circle" className={styles.profileTypeInfo} />
        </Tooltip>
      </Button>

      <form aria-label="query-input" className={styles.wrapper} onSubmit={actions.submitForm}>
        <pre className={cx(styles.highlight, 'language-promql')} aria-hidden="true">
          <code className="language-promql" id="highlighting-content" ref={codeRef} style={textAreaSize}>
            {data.query}
          </code>
        </pre>

        <TextareaAutosize
          ref={textAreaRef}
          className={styles.input}
          value={data.query}
          onChange={actions.handleTextAreaChange}
          onKeyDown={actions.handleTextareaKeyDown}
          spellCheck="false"
        />

        <Button type="submit" style={{ height: textAreaSize.height }}>
          Execute
        </Button>
      </form>
    </>
  );
}
