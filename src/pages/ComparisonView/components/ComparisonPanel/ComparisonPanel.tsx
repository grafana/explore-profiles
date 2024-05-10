import { css, cx } from '@emotion/css';
import { useStyles2 } from '@grafana/ui';
import { FlameGraph } from '@shared/components/FlameGraph/FlameGraph';
import { InlineBanner } from '@shared/components/InlineBanner';
import { Panel } from '@shared/components/Panel';
import { QueryBuilder } from '@shared/components/QueryBuilder/QueryBuilder';
import { SingleTimeline } from '@shared/components/Timeline/SingleTimeline';
import { displayWarning } from '@shared/domain/displayStatus';
import React from 'react';

import { LEFT_TIMELINE_COLORS, RIGHT_TIMELINE_COLORS } from '../../ui/colors';
import { useComparisonPanel } from './domain/useComparisonPanel';

type ComparisonPanelProps = {
  type: 'baseline' | 'comparison';
};

const getStyles = () => ({
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
    background: ${LEFT_TIMELINE_COLORS.COLOR.toString()};
  `,
  comparisonIcon: css`
    background: ${RIGHT_TIMELINE_COLORS.COLOR.toString()};
  `,
  // prevents the "Add filter..." and "Execute" button to be rendered outside of the panel in certain cases
  queryBuilder: css`
    flex-wrap: wrap;
  `,
});

export function ComparisonPanel({ type }: ComparisonPanelProps) {
  const styles = useStyles2(getStyles);

  const isBaselinePanel = type === 'baseline';
  const { data, actions } = useComparisonPanel(isBaselinePanel);

  const title = isBaselinePanel ? 'Baseline time range' : 'Comparison time range';
  const dataTestId = isBaselinePanel ? 'baseline-panel' : 'comparison-panel';
  const queryBuilderId = isBaselinePanel ? 'query-builder-baseline' : 'query-builder-comparison';
  const color = isBaselinePanel ? LEFT_TIMELINE_COLORS.COLOR : RIGHT_TIMELINE_COLORS.COLOR;

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
        </>
      }
      isLoading={data.isLoading}
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

      {data.fetchProfileDataError && (
        <InlineBanner
          severity="error"
          title="Error while loading flamegraph data!"
          errors={[data.fetchProfileDataError]}
        />
      )}
      {data.noProfileDataAvailable && (
        <InlineBanner
          severity="warning"
          title="No profile data available"
          message="Please verify that you've selected an adequate time range and filters."
        />
      )}
      {/* we don't always display the flamegraph because if there's no data, the UI does not look good */}
      {/* we probably should open a PR in the @grafana/flamegraph repo to improve this */}
      {data.shouldDisplayFlamegraph && (
        <FlameGraph
          vertical
          profile={data.profile}
          enableFlameGraphDotComExport={data.settings?.enableFlameGraphDotComExport}
          collapsedFlamegraphs={data.settings?.collapsedFlamegraphs}
        />
      )}
    </Panel>
  );
}
