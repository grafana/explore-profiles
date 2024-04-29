import { css } from '@emotion/css';
import { useStyles2 } from '@grafana/ui';
import { Panel } from '@shared/components/Panel';
import { DoubleTimeline } from '@shared/components/Timeline/DoubleTimeline';
import { Toolbar } from '@shared/components/Toolbar/Toolbar';
import { PageTitle } from '@shared/ui/PageTitle';
import React from 'react';

import { LeftPanel } from './components/LeftPanel/LeftPanel';
import { RightPanel } from './components/RightPanel/RightPanel';
import { LEFT_TIMELINE_COLORS, RIGHT_TIMELINE_COLORS, useComparisonView } from './domain/useComparisonView';
import { ComparisonViewErrors } from './ui/ComparisonViewErrors';
import { ComparisonViewWarnings } from './ui/ComparisonViewWarnings';

const getStyles = () => ({
  flex: css`
    display: flex;
    flex-direction: row;
    gap: 15px;
  `,
});

export function ComparisonView() {
  const styles = useStyles2(getStyles);
  const { data, actions } = useComparisonView();

  return (
    <>
      <PageTitle title="Comparison" />

      <Toolbar
        isLoading={data.isLoadingMain}
        onRefresh={actions.refresh}
        onChangeTimeRange={actions.setMainTimeRange}
      />

      <Panel title={data.title} isLoading={data.isLoadingMain} dataTestId="main-timeline-panel">
        <ComparisonViewErrors
          leftTimelineError={data.fetchLeftTimelineDataError}
          rightTimelineError={data.fetchRightTimelineDataError}
        />

        <ComparisonViewWarnings
          noLeftDataAvailable={data.noLeftDataAvailable}
          noRightDataAvailable={data.noRightDataAvailable}
        />

        {/* we always display the timeline to prevent layout shifts */}
        <DoubleTimeline
          timeRange={data.mainTimeRange}
          onSelectTimeRange={actions.setMainTimeRange}
          leftColor={LEFT_TIMELINE_COLORS.COLOR}
          leftTimeline={data.leftTimeline}
          leftSelection={data.leftTimelineSelection}
          rightColor={RIGHT_TIMELINE_COLORS.COLOR}
          rightTimeline={data.rightTimeline}
          rightSelection={data.rightTimelineSelection}
        />
      </Panel>

      <div className={styles.flex} data-testid="comparison-container">
        <LeftPanel />
        <RightPanel />
      </div>
    </>
  );
}
