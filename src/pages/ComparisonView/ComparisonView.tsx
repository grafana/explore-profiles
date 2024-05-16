import { css } from '@emotion/css';
import { useStyles2 } from '@grafana/ui';
import { Panel } from '@shared/components/Panel';
import { DoubleTimeline } from '@shared/components/Timeline/DoubleTimeline';
import { Toolbar } from '@shared/components/Toolbar/Toolbar';
import { useToggleSidePanel } from '@shared/domain/useToggleSidePanel';
import { PageTitle } from '@shared/ui/PageTitle';
import React, { useState } from 'react';

import { ComparisonDiffPanel } from './components/ComparisonDiffPanel/ComparisonDiffPanel';
import { ComparisonPanel } from './components/ComparisonPanel/ComparisonPanel';
import { FlameGraphContainer } from './components/FlameGraphContainer/FlameGraphContainer';
import { useComparisonView } from './domain/useComparisonView';
import { BASELINE_COLORS, COMPARISON_COLORS } from './ui/colors';
import { ComparisonViewErrors } from './ui/ComparisonViewErrors';
import { ComparisonViewWarnings } from './ui/ComparisonViewWarnings';

const getStyles = () => ({
  flex: css`
    display: flex;

    & > :last-child {
      margin-left: 8px;
    }
  `,
});

type ComparisonDiffViewProps = {
  diff: boolean;
};

export function ComparisonView({ diff }: ComparisonDiffViewProps) {
  const styles = useStyles2(getStyles);
  const { data, actions } = useComparisonView(diff);
  const sidePanel = useToggleSidePanel();

  const [isLoadingLeft, setIsLoadingLeft] = useState<boolean>(false);
  const [isLoadingRight, setIsLoadingRight] = useState<boolean>(false);
  const [isLoadingDiff, setIsLoadingDiff] = useState<boolean>(false);
  const [showExplainFlameGraphButton, setShowExplainFlameGraphButton] = useState<boolean>(false);

  return (
    <>
      <PageTitle title={diff ? 'Comparison diff view' : 'Comparison view'} />

      <Toolbar
        isLoading={data.isLoadingMain}
        onRefresh={() => {
          actions.refresh();
          sidePanel.close();
        }}
        onChangeTimeRange={actions.setMainTimeRange}
        onChangeService={actions.resetQueries}
        onChangeProfileType={actions.updateQueries}
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
          leftColor={BASELINE_COLORS.COLOR}
          leftTimeline={data.leftTimeline}
          leftSelection={data.leftTimelineSelection}
          rightColor={COMPARISON_COLORS.COLOR}
          rightTimeline={data.rightTimeline}
          rightSelection={data.rightTimelineSelection}
        />
      </Panel>

      <div className={styles.flex} data-testid="comparison-container">
        <ComparisonPanel type="baseline" isLoading={isLoadingLeft}>
          {!diff && <FlameGraphContainer target="left-profile" onLoadingChange={setIsLoadingLeft} />}
        </ComparisonPanel>

        <ComparisonPanel type="comparison" isLoading={isLoadingRight}>
          {!diff && <FlameGraphContainer target="right-profile" onLoadingChange={setIsLoadingRight} />}
        </ComparisonPanel>
      </div>

      {diff && (
        <ComparisonDiffPanel
          sidePanel={sidePanel}
          isLoading={isLoadingDiff}
          showExplainFlameGraphButton={showExplainFlameGraphButton}
        >
          <FlameGraphContainer
            target="diff-profile"
            onLoadingChange={(isLoading, hasFlameGraph) => {
              setIsLoadingDiff(isLoading);
              setShowExplainFlameGraphButton(hasFlameGraph);
            }}
          />
        </ComparisonDiffPanel>
      )}
    </>
  );
}
