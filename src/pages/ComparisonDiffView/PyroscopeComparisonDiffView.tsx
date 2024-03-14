import ChartTitle from '@pyroscope/components/ChartTitle';
import { FlameGraphWrapper } from '@pyroscope/components/FlameGraphWrapper';
import PageTitle from '@pyroscope/components/PageTitle';
import { Panel } from '@pyroscope/components/Panel';
import TagsBar from '@pyroscope/components/TagsBar';
import SyncTimelines from '@pyroscope/components/TimelineChart/SyncTimelines';
import TimelineChartWrapper from '@pyroscope/components/TimelineChart/TimelineChartWrapper';
import Toolbar from '@pyroscope/components/Toolbar';
import usePopulateLeftRightQuery from '@pyroscope/hooks/populateLeftRightQuery.hook';
import useTags from '@pyroscope/hooks/tags.hook';
import useTimelines, { leftColor, rightColor, selectionColor } from '@pyroscope/hooks/timeline.hook';
import useTimeZone from '@pyroscope/hooks/timeZone.hook';
import { PageContentWrapper } from '@pyroscope/pages/PageContentWrapper';
import { useAppDispatch, useAppSelector } from '@pyroscope/redux/hooks';
import {
  actions,
  fetchDiffView,
  fetchTagValues,
  selectAnnotationsOrDefault,
  selectContinuousState,
  selectQueries,
  selectTimelineSides,
} from '@pyroscope/redux/reducers/continuous';
import { AiPanel } from '@shared/components/AiPanel/AiPanel';
import { ExplainFlameGraphButton } from '@shared/components/AiPanel/components/ExplainFlameGraphButton';
import { useToggleSidePanel } from '@shared/domain/useToggleSidePanel';
import React, { useEffect } from 'react';

import styles from './ContinuousSingleView.module.css';
import { formatTitle } from './formatTitle';
import { isLoadingOrReloading } from './isLoadingOrReloading';

export function PyroscopeComparisonDiffView() {
  const dispatch = useAppDispatch();
  const { diffView, refreshToken, maxNodes, leftFrom, rightFrom, leftUntil, rightUntil } =
    useAppSelector(selectContinuousState);
  const { leftQuery, rightQuery } = useAppSelector(selectQueries);
  const annotations = useAppSelector(selectAnnotationsOrDefault('diffView'));

  usePopulateLeftRightQuery();
  const { leftTags, rightTags } = useTags();
  const { leftTimeline, rightTimeline } = useTimelines();

  const timelines = useAppSelector(selectTimelineSides);
  const { offset } = useTimeZone();
  const timezone = offset === 0 ? 'utc' : 'browser';

  const isLoading = isLoadingOrReloading([diffView.type, timelines.left.type, timelines.right.type]);

  useEffect(() => {
    if (rightQuery && leftQuery) {
      const fetchData = dispatch(
        fetchDiffView({
          leftQuery,
          leftFrom,
          leftUntil,

          rightQuery,
          rightFrom,
          rightUntil,
        })
      );
      return fetchData.abort;
    }
    return undefined;
  }, [dispatch, leftFrom, leftUntil, leftQuery, rightFrom, rightUntil, rightQuery, refreshToken, maxNodes]);

  const sidePanel = useToggleSidePanel();

  return (
    <div>
      <PageTitle title={formatTitle('Diff', leftQuery, rightQuery)} />

      <PageContentWrapper>
        <Toolbar
          onSelectedApp={(query) => {
            dispatch(actions.setQuery(query));
          }}
        />

        <Panel isLoading={isLoading} title={<ChartTitle titleKey={diffView.profile?.metadata.name as any} />}>
          <TimelineChartWrapper
            data-testid="timeline-main"
            id="timeline-chart-diff"
            format="lines"
            height="125px"
            annotations={annotations}
            timelineA={leftTimeline}
            timelineB={rightTimeline}
            onSelect={(from, until) => {
              dispatch(actions.setFromAndUntil({ from, until }));
            }}
            syncCrosshairsWith={['timeline-chart-left', 'timeline-chart-right']}
            selection={{
              left: {
                from: leftFrom,
                to: leftUntil,
                color: leftColor,
                overlayColor: leftColor.alpha(0.3),
              },
              right: {
                from: rightFrom,
                to: rightUntil,
                color: rightColor,
                overlayColor: rightColor.alpha(0.3),
              },
            }}
            selectionType="double"
            timezone={timezone}
          />
          <SyncTimelines
            isDataLoading={isLoading}
            timeline={leftTimeline}
            leftSelection={{ from: leftFrom, to: leftUntil }}
            rightSelection={{ from: rightFrom, to: rightUntil }}
            onSync={(from, until) => {
              dispatch(actions.setFromAndUntil({ from, until }));
            }}
          />
        </Panel>

        <div className="diff-instructions-wrapper">
          <Panel
            dataTestId="baseline-panel"
            isLoading={isLoading}
            className="diff-instructions-wrapper-side"
            title={<ChartTitle titleKey="baseline" color={leftColor} />}
          >
            <TagsBar
              query={leftQuery}
              tags={leftTags}
              onRefresh={() => dispatch(actions.refresh())}
              onSetQuery={(q) => dispatch(actions.setLeftQuery(q))}
              onSelectedLabel={(label, query) => {
                dispatch(fetchTagValues({ query, label }));
              }}
            />

            <TimelineChartWrapper
              data-testid="timeline-left"
              key="timeline-chart-left"
              id="timeline-chart-left"
              timelineA={leftTimeline}
              syncCrosshairsWith={['timeline-chart-diff', 'timeline-chart-right']}
              selectionWithHandler
              onSelect={(from, until) => {
                dispatch(actions.setLeft({ from, until }));
              }}
              selection={{
                left: {
                  from: leftFrom,
                  to: leftUntil,
                  color: selectionColor,
                  overlayColor: selectionColor.alpha(0.3),
                },
              }}
              selectionType="single"
              timezone={timezone}
            />
          </Panel>

          <Panel
            dataTestId="comparison-panel"
            isLoading={isLoading}
            className="diff-instructions-wrapper-side"
            title={<ChartTitle titleKey="comparison" color={rightColor} />}
          >
            <TagsBar
              query={rightQuery}
              tags={rightTags}
              onRefresh={() => dispatch(actions.refresh())}
              onSetQuery={(q) => dispatch(actions.setRightQuery(q))}
              onSelectedLabel={(label, query) => {
                dispatch(fetchTagValues({ query, label }));
              }}
            />

            <TimelineChartWrapper
              data-testid="timeline-right"
              key="timeline-chart-right"
              id="timeline-chart-right"
              selectionWithHandler
              timelineA={rightTimeline}
              syncCrosshairsWith={['timeline-chart-diff', 'timeline-chart-left']}
              onSelect={(from, until) => {
                dispatch(actions.setRight({ from, until }));
              }}
              selection={{
                right: {
                  from: rightFrom,
                  to: rightUntil,
                  color: selectionColor,
                  overlayColor: selectionColor.alpha(0.3),
                },
              }}
              selectionType="single"
              timezone={timezone}
            />
          </Panel>
        </div>

        <div className={styles.flex}>
          <Panel
            className={styles.flamegraphPanel}
            isLoading={isLoading}
            dataTestId="diff-panel"
            headerActions={
              !sidePanel.isOpen('ai') ? (
                <ExplainFlameGraphButton onClick={() => sidePanel.open('ai')} disabled={isLoading} />
              ) : null
            }
          >
            <FlameGraphWrapper profile={diffView.profile} diff={true} />
          </Panel>

          {sidePanel.isOpen('ai') && <AiPanel isDiff className={styles.sidePanel} onClose={sidePanel.close} />}
        </div>
      </PageContentWrapper>
    </div>
  );
}
