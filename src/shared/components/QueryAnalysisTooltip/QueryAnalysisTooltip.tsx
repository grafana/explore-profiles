import { css } from '@emotion/css';
import { formattedValueToString, getValueFormat, GrafanaTheme2 } from '@grafana/data';
import { t, Trans } from '@grafana/i18n';
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
          <div className={styles.headerColumn}>
            <Trans i18nKey="query-analysis.data-in-time-range">Data in time range</Trans>
          </div>
          <div className={styles.column}>{totalBytesInTimeRange}</div>
          <div className={styles.column}>&nbsp;</div>
        </div>
        {data.queryImpact.totalQueriedSeries !== undefined && (
          <div className={styles.row}>
            <div className={styles.headerColumn}>
              <Trans i18nKey="query-analysis.series-in-query">Series in query</Trans>
            </div>
            <div className={styles.column}>{formatCount(data.queryImpact.totalQueriedSeries)}</div>
            <div className={styles.column}>&nbsp;</div>
          </div>
        )}
        <div className={styles.row}>
          <div className={styles.headerColumn}>
            <Trans i18nKey="query-analysis.deduplication">Deduplication</Trans>
          </div>
          <div className={styles.column}>
            {data.queryImpact.deduplicationNeeded ? t('query-analysis.yes', 'yes') : t('query-analysis.no', 'no')}
          </div>
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
          <div className={styles.headerColumn}>
            <Trans i18nKey="query-analysis.replicas">Replicas</Trans>
          </div>
          {data.queryScopes.map((s, i) => (
            <div key={i} className={styles.column}>
              {s.componentCount || '/'}
            </div>
          ))}
        </div>
        <div className={styles.row}>
          <div className={styles.headerColumn}>
            <Trans i18nKey="query-analysis.blocks">Blocks</Trans>
          </div>
          {data.queryScopes.map((s, i) => (
            <div key={i} className={styles.column}>
              {formatCount(s.blockCount) || '/'}
            </div>
          ))}
        </div>
        <div className={styles.row}>
          <div className={styles.headerColumn}>
            <Trans i18nKey="query-analysis.series">Series</Trans>
          </div>
          {data.queryScopes.map((s, i) => (
            <div key={i} className={styles.column}>
              {formatCount(s.seriesCount) || '/'}
            </div>
          ))}
        </div>
        <div className={styles.row}>
          <div className={styles.headerColumn}>
            <Trans i18nKey="query-analysis.profiles">Profiles</Trans>
          </div>
          {data.queryScopes.map((s, i) => (
            <div key={i} className={styles.column}>
              {formatCount(s.profileCount) || '/'}
            </div>
          ))}
        </div>
        <div className={styles.row}>
          <div className={styles.headerColumn}>
            <Trans i18nKey="query-analysis.samples">Samples</Trans>
          </div>
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
          <div className={styles.headerColumn}>
            <Trans i18nKey="query-analysis.index-store">Index Store</Trans>
          </div>
          {data.queryScopes.map((s, i) => (
            <div key={i} className={styles.column}>
              {formatSize(s.indexBytes) || '/'}
            </div>
          ))}
        </div>
        <div className={styles.row}>
          <div className={styles.headerColumn}>
            <Trans i18nKey="query-analysis.profiles-store">Profiles Store</Trans>
          </div>
          {data.queryScopes.map((s, i) => (
            <div key={i} className={styles.column}>
              {formatSize(s.profileBytes) || '/'}
            </div>
          ))}
        </div>
        <div className={styles.row}>
          <div className={styles.headerColumn}>
            <Trans i18nKey="query-analysis.symbols-store">Symbols Store</Trans>
          </div>
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
            <span className={styles.contentWithIcon}>
              <Trans i18nKey="query-analysis.stored-data-in-time-range">
                Stored data in time range: {{ totalBytesInTimeRange }}
              </Trans>
            </span>
            &nbsp;
            <IconButton name="database" aria-label={t('query-analysis.query-info-aria-label', 'Query info')} />
          </div>
        </Toggletip>
      ) : null}
    </>
  );
}
