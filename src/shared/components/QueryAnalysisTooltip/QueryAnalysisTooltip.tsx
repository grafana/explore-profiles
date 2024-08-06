import { css } from '@emotion/css';
import { formattedValueToString, getValueFormat, GrafanaTheme2 } from '@grafana/data';
import { Divider, IconButton, styleMixins, Toggletip, useStyles2 } from '@grafana/ui';
import React, { useMemo } from 'react';

import { QueryAnalysisResult } from './domain/QueryAnalysis';

const getStyles = (theme: GrafanaTheme2) => ({
  row: css({
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  }),
  headerColumn: css({
    display: 'flex',
    flexDirection: 'column',
    minWidth: '120px',
    alignItems: 'start',
  }),
  column: css({
    display: 'flex',
    flexDirection: 'column',
    minWidth: '120px',
    alignItems: 'end',
  }),
  tooltip: css({
    display: 'flex',
    color: theme.colors.text.secondary,
    fontSize: theme.typography.bodySmall.fontSize,
  }),
  contentWithIcon: css({
    display: 'none',

    [`@media ${styleMixins.mediaUp(theme.v1.breakpoints.sm)}`]: {
      display: 'block',
    },
  }),
});

type QueryAnalysisTooltipProps = {
  data: QueryAnalysisResult;
};

const formatSize = (size: number) => formattedValueToString(getValueFormat('decbytes')(size));

const formatCount = (count: number) => formattedValueToString(getValueFormat('short')(count));

export function QueryAnalysisTooltip(props: QueryAnalysisTooltipProps) {
  const styles = useStyles2(getStyles);
  const { data } = props;
  const totalBytesInTimeRange = formatSize(data.queryImpact.totalBytesInTimeRange);

  const queryAnalysisTooltip = useMemo(() => {
    return (
      <div data-testid="queryAnalysis-popup">
        <div className={styles.row}>
          <div className={styles.headerColumn}>Data in time range</div>
          <div className={styles.column}>{totalBytesInTimeRange}</div>
          <div className={styles.column}>&nbsp;</div>
        </div>
        {data.queryImpact.totalQueriedSeries !== undefined && (
          <div className={styles.row}>
            <div className={styles.headerColumn}>Series in query</div>
            <div className={styles.column}>{formatCount(data.queryImpact.totalQueriedSeries)}</div>
            <div className={styles.column}>&nbsp;</div>
          </div>
        )}
        <div className={styles.row}>
          <div className={styles.headerColumn}>Deduplication</div>
          <div className={styles.column}>{data.queryImpact.deduplicationNeeded ? 'yes' : 'no'}</div>
          <div className={styles.column}>&nbsp;</div>
        </div>
        <Divider />
        <div className={styles.row}>
          <div className={styles.headerColumn}>&nbsp;</div>
          {data.queryScopes.map((s, i) => (
            <div key={i} className={styles.column}>
              <strong>{s.componentType}</strong>
            </div>
          ))}
        </div>
        <div className={styles.row}>
          <div className={styles.headerColumn}>Replicas</div>
          {data.queryScopes.map((s, i) => (
            <div key={i} className={styles.column}>
              {s.componentCount || '/'}
            </div>
          ))}
        </div>
        <div className={styles.row}>
          <div className={styles.headerColumn}>Blocks</div>
          {data.queryScopes.map((s, i) => (
            <div key={i} className={styles.column}>
              {formatCount(s.blockCount) || '/'}
            </div>
          ))}
        </div>
        <div className={styles.row}>
          <div className={styles.headerColumn}>Series</div>
          {data.queryScopes.map((s, i) => (
            <div key={i} className={styles.column}>
              {formatCount(s.seriesCount) || '/'}
            </div>
          ))}
        </div>
        <div className={styles.row}>
          <div className={styles.headerColumn}>Profiles</div>
          {data.queryScopes.map((s, i) => (
            <div key={i} className={styles.column}>
              {formatCount(s.profileCount) || '/'}
            </div>
          ))}
        </div>
        <div className={styles.row}>
          <div className={styles.headerColumn}>Samples</div>
          {data.queryScopes.map((s, i) => (
            <div key={i} className={styles.column}>
              {formatCount(s.sampleCount) || '/'}
            </div>
          ))}
        </div>
        <div className={styles.row}>
          <div className={styles.headerColumn}>&nbsp;</div>
          <div className={styles.column}>&nbsp;</div>
          <div className={styles.column}>&nbsp;</div>
        </div>
        <div className={styles.row}>
          <div className={styles.headerColumn}>Index Store</div>
          {data.queryScopes.map((s, i) => (
            <div key={i} className={styles.column}>
              {formatSize(s.indexBytes) || '/'}
            </div>
          ))}
        </div>
        <div className={styles.row}>
          <div className={styles.headerColumn}>Profiles Store</div>
          {data.queryScopes.map((s, i) => (
            <div key={i} className={styles.column}>
              {formatSize(s.profileBytes) || '/'}
            </div>
          ))}
        </div>
        <div className={styles.row}>
          <div className={styles.headerColumn}>Symbols Store</div>
          {data.queryScopes.map((s, i) => (
            <div key={i} className={styles.column}>
              {formatSize(s.symbolBytes) || '/'}
            </div>
          ))}
        </div>
      </div>
    );
  }, [data, styles, totalBytesInTimeRange]);

  return (
    <>
      {data.queryImpact.totalBytesInTimeRange !== undefined ? (
        <Toggletip content={queryAnalysisTooltip} fitContent={true}>
          <div className={styles.tooltip} data-testid="queryAnalysis-tooltip">
            <span className={styles.contentWithIcon}>Stored data in time range: {totalBytesInTimeRange}</span>
            &nbsp;
            <IconButton name="database" aria-label="Query info" />
          </div>
        </Toggletip>
      ) : null}
    </>
  );
}
