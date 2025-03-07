import { css } from '@emotion/css';
import { Button, Tooltip, useStyles2 } from '@grafana/ui';
import React from 'react';

type Props = {
  spanSelector: string;
  removeSpanSelector: () => void;
};

export function SpanSelectorLabel(props: Props) {
  const { spanSelector, removeSpanSelector } = props;
  const styles = useStyles2(getStyles);

  return (
    <div className={styles.container}>
      <Tooltip content={`You have added a span selector to the flamegraph query (${spanSelector}).`} placement="top">
        <span>Span selector added</span>
      </Tooltip>
      <Button
        size="md"
        fill="text"
        variant="secondary"
        icon="times"
        tooltip={`Remove span selector from query`}
        tooltipPlacement="top"
        onClick={() => {
          removeSpanSelector();
        }}
      />
    </div>
  );
}

const getStyles = () => ({
  container: css`
    padding: 0 4px;
  `,
});
