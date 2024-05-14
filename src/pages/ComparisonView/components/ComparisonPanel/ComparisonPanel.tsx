import { css, cx } from '@emotion/css';
import { GrafanaTheme2 } from '@grafana/data';
import { Icon, Tooltip, useStyles2 } from '@grafana/ui';
import { InlineBanner } from '@shared/components/InlineBanner';
import { Panel } from '@shared/components/Panel';
import { QueryBuilder } from '@shared/components/QueryBuilder/QueryBuilder';
import { SingleTimeline } from '@shared/components/Timeline/SingleTimeline';
import { displayWarning } from '@shared/domain/displayStatus';
import React, { ReactNode } from 'react';

import { BASELINE_COLORS, COMPARISON_COLORS } from '../../ui/colors';
import { useComparisonPanel } from './domain/useComparisonPanel';

type ComparisonPanelProps = {
  type: 'baseline' | 'comparison';
  isLoading: boolean;
  children?: ReactNode;
};

const getStyles = (theme: GrafanaTheme2) => ({
  panel: css`
    flex: 1;
    max-width: 50%;
  `,
  timeline: css`
    margin-bottom: 16px;
  `,
  panelIcon: css`
    width: 10px;
    height: 10px;
    border-radius: 50%;
    display: inline-block;
    margin-right: 6px;
  `,
  baselineIcon: css`
    background: ${BASELINE_COLORS.COLOR.toString()};
  `,
  comparisonIcon: css`
    background: ${COMPARISON_COLORS.COLOR.toString()};
  `,
  // prevents the "Add filter..." and "Execute" button to be rendered outside of the panel in certain cases
  queryBuilder: css`
    flex-wrap: wrap;
  `,
  warningIcon: css`
    margin-left: 8px;
    color: ${theme.colors.warning.text};
  `,
});

export function ComparisonPanel({ isLoading, type, children }: ComparisonPanelProps) {
  const styles = useStyles2(getStyles);

  const isBaselinePanel = type === 'baseline';
  const { data, actions } = useComparisonPanel(isBaselinePanel);

  const title = isBaselinePanel ? 'Baseline time range' : 'Comparison time range';
  const dataTestId = isBaselinePanel ? 'baseline-panel' : 'comparison-panel';
  const queryBuilderId = isBaselinePanel ? 'query-builder-baseline' : 'query-builder-comparison';
  const color = isBaselinePanel ? BASELINE_COLORS.COLOR : COMPARISON_COLORS.COLOR;

  if (data.fetchSettingsError) {
    displayWarning([
      'Error while retrieving the plugin settings!',
      'Some features might not work as expected (e.g. flamegraph export options). Please try to reload the page, sorry for the inconvenience.',
    ]);
  }

  return (
    <Panel
      className={styles.panel}
      title={
        <>
          <div className={cx(styles.panelIcon, isBaselinePanel ? styles.baselineIcon : styles.comparisonIcon)} />
          <span>{title}</span>
          {data.selectionOutOfRange && (
            <Tooltip
              content="The timeline selection is out of range, the flame graph does not correspond to the timeseries displayed. Zoom out to see the actual selection."
              placement="top"
            >
              <Icon name="exclamation-triangle" className={styles.warningIcon} />
            </Tooltip>
          )}
        </>
      }
      isLoading={data.isLoading || isLoading}
      dataTestId={dataTestId}
    >
      <QueryBuilder
        id={queryBuilderId}
        className={styles.queryBuilder}
        query={data.query}
        // FIXME
        from={data.mainTimeRange.from.unix() * 1000}
        until={data.mainTimeRange.to.unix() * 1000}
        onChangeQuery={actions.setQuery}
      />

      <div className={styles.timeline}>
        {data.fetchTimelineDataError && (
          <InlineBanner
            severity="error"
            title="Error while loading timeline data!"
            errors={[data.fetchTimelineDataError]}
          />
        )}
        {data.noTimelineDataAvailable && (
          <InlineBanner
            severity="warning"
            title="No timeline data available"
            message="Please verify that you've selected a proper service, profile type and time range."
          />
        )}
        {/* we always display the timeline to prevent layout shifts */}
        <SingleTimeline
          timeline={data.timeline}
          timeRange={data.mainTimeRange}
          onSelectTimeRange={actions.selectTimeRange}
          color={color}
          selection={data.timelineSelection}
        />
      </div>

      {children}
    </Panel>
  );
}
