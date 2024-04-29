import { css } from '@emotion/css';
import { useStyles2 } from '@grafana/ui';
import { FlameGraph } from '@shared/components/FlameGraph/FlameGraph';
import { InlineBanner } from '@shared/components/InlineBanner';
import { Panel } from '@shared/components/Panel';
import { QueryBuilder } from '@shared/components/QueryBuilder/QueryBuilder';
import { SingleTimeline } from '@shared/components/Timeline/SingleTimeline';
import { displayWarning } from '@shared/domain/displayStatus';
import React from 'react';

import { RIGHT_TIMELINE_COLORS } from '../../domain/useComparisonView';
import { useRightPanel } from './domain/useRightPanel';

const getStyles = () => ({
  comparisonPanel: css`
    flex: 1;
  `,
  timeline: css`
    margin-bottom: 16px;
  `,
  // purple
  comparisonIcon: css`
    background: ${RIGHT_TIMELINE_COLORS.COLOR.toString()};
    width: 10px;
    height: 10px;
    border-radius: 50%;
    display: inline-block;
    margin-right: 6px;
  `,
  // prevents the "Add filter..." and "Execute" button to be rendered outside of the panel in certain cases
  queryBuilder: css`
    flex-wrap: wrap;
  `,
});

// Comparison panel
export function RightPanel() {
  const styles = useStyles2(getStyles);

  const { data, actions } = useRightPanel();

  if (data.fetchSettingsError) {
    displayWarning([
      'Error while retrieving the plugin settings!',
      'Some features might not work as expected (e.g. flamegraph export options). Please try to reload the page, sorry for the inconvenience.',
    ]);
  }

  return (
    <Panel
      className={styles.comparisonPanel}
      title={
        <>
          <div className={styles.comparisonIcon} />
          <span>Comparison time range</span>
        </>
      }
      isLoading={data.isLoading}
      dataTestId="comparison-panel"
    >
      <QueryBuilder
        id="query-builder-comparison"
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
          color={RIGHT_TIMELINE_COLORS.COLOR}
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
