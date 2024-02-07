import { css } from '@emotion/css';
import { GrafanaTheme2 } from '@grafana/data';
import { useStyles2 } from '@grafana/ui';
import ChartTitle from '@pyroscope/components/ChartTitle';
import { FlameGraphWrapper } from '@pyroscope/components/FlameGraphWrapper';
import PageTitle from '@pyroscope/components/PageTitle';
import { Panel } from '@pyroscope/components/Panel';
import TagsBar from '@pyroscope/components/TagsBar';
import { ContextMenuProps } from '@pyroscope/components/TimelineChart/ContextMenu.plugin';
import TimelineChartWrapper from '@pyroscope/components/TimelineChart/TimelineChartWrapper';
import Toolbar from '@pyroscope/components/Toolbar';
import useColorMode from '@pyroscope/hooks/colorMode.hook';
import useTags from '@pyroscope/hooks/tags.hook';
import useTimeZone from '@pyroscope/hooks/timeZone.hook';
import { PageContentWrapper } from '@pyroscope/pages/PageContentWrapper';
import { useAppDispatch, useAppSelector } from '@pyroscope/redux/hooks';
import {
  actions,
  addAnnotation,
  fetchSingleView,
  fetchTagValues,
  selectAnnotationsOrDefault,
  selectQueries,
  setDateRange,
  setQuery,
} from '@pyroscope/redux/reducers/continuous';
import { isAnnotationsEnabled } from '@pyroscope/util/features';
import { addQueryToPageTitle } from '@shared/domain/addQueryToPageTitle';
import { isLoadingOrReloading } from '@shared/domain/loading';
import { createTooltip } from '@shared/ui/createTooltip';
import React, { useEffect } from 'react';

import AiPanel from '../../shared/AiPanel';
import { AskAiButton } from '../../shared/AskAiButton';
import { useAiPanel } from '../../shared/hooks/useAiPanel';
import AddAnnotationMenuItem from './continuous/contextMenu/AddAnnotation.menuitem';
import ContextMenu from './continuous/contextMenu/ContextMenu';

// eslint-disable-next-line no-unused-vars
export const getStyles = (theme: GrafanaTheme2) => ({
  flamegraphContainer: css`
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    animation: fadeIn 1s;
    @keyframes fadeIn {
      0% {
        opacity: 0;
      }
      100% {
        opacity: 1;
      }
    }
  `,
  flamegraphComponent: css`
    flex-basis: 50%;
    flex-grow: 1;
    flex-shrink: 0;
  `,
  aiPanel: css`
    flex-basis: 50%;
    flex-grow: 1;
    flex-shrink: 0;

    margin-left: 16px;
    border-left: 2px solid #000;
  `,
});

function ContinuousSingleView() {
  const styles = useStyles2(getStyles);

  const dispatch = useAppDispatch();
  const { offset } = useTimeZone();
  const { colorMode } = useColorMode();

  const { query } = useAppSelector(selectQueries);
  const tags = useTags().regularTags;
  const { from, until, refreshToken } = useAppSelector((state) => state.continuous);

  const { singleView } = useAppSelector((state) => state.continuous);
  const annotations = useAppSelector(selectAnnotationsOrDefault('singleView'));

  useEffect(() => {
    if (from && until && query) {
      const fetchData = dispatch(fetchSingleView(null));
      return () => fetchData.abort('cancel');
    }
    return undefined;
  }, [from, until, query, refreshToken, dispatch]);

  const flamegraphRenderer = (() => {
    switch (singleView.type) {
      case 'loaded':
      case 'reloading': {
        return <FlameGraphWrapper profile={singleView.profile} />;
      }

      default: {
        return 'Loading';
      }
    }
  })();

  const getTimeline = () => {
    switch (singleView.type) {
      case 'loaded':
      case 'reloading': {
        return {
          data: singleView.timeline,
          color: colorMode === 'light' ? '#3b78e7' : undefined,
        };
      }

      default: {
        return {
          data: undefined,
        };
      }
    }
  };

  const contextMenu = (props: ContextMenuProps) => {
    if (!isAnnotationsEnabled) {
      return null;
    }

    const { click, timestamp, containerEl } = props;

    if (!click) {
      return null;
    }

    return (
      <ContextMenu position={props?.click}>
        <AddAnnotationMenuItem
          container={containerEl}
          popoverAnchorPoint={{ x: click.pageX, y: click.pageY }}
          timestamp={timestamp}
          timezone={offset === 0 ? 'utc' : 'browser'}
          onCreateAnnotation={(content) => {
            dispatch(
              addAnnotation({
                appName: query,
                timestamp,
                content,
              })
            );
          }}
        />
      </ContextMenu>
    );
  };

  const { isAiPanelOpen, onClickAskAi, onClickCloseAiPanel } = useAiPanel(query, from, until);

  return (
    <div>
      <PageTitle title={addQueryToPageTitle('Single AI', query)} />
      <PageContentWrapper>
        <Toolbar
          onSelectedApp={(query) => {
            dispatch(setQuery(query));
          }}
        />
        <TagsBar
          query={query}
          tags={tags}
          onRefresh={() => dispatch(actions.refresh())}
          onSetQuery={(q) => dispatch(actions.setQuery(q))}
          onSelectedLabel={(label, query) => {
            dispatch(fetchTagValues({ query, label }));
          }}
        />

        <Panel
          isLoading={isLoadingOrReloading([singleView.type])}
          title={
            <ChartTitle className="singleView-timeline-title" titleKey={singleView?.profile?.metadata.name as any} />
          }
        >
          <TimelineChartWrapper
            timezone={offset === 0 ? 'utc' : 'browser'}
            data-testid="timeline-single"
            id="timeline-chart-single"
            timelineA={getTimeline()}
            onSelect={(from, until) => dispatch(setDateRange({ from, until }))}
            height="125px"
            annotations={annotations}
            selectionType="single"
            ContextMenu={contextMenu}
            onHoverDisplayTooltip={(data) => createTooltip(query, data, singleView.profile)}
          />
        </Panel>

        <Panel
          isLoading={isLoadingOrReloading([singleView.type])}
          headerActions={!isAiPanelOpen ? <AskAiButton onClick={onClickAskAi} /> : null}
        >
          {isAiPanelOpen ? (
            <div className={styles.flamegraphContainer}>
              <div className={styles.flamegraphComponent}>{flamegraphRenderer}</div>
              <div className={styles.aiPanel}>
                <AiPanel query={query} from={from} until={until} onClickClose={onClickCloseAiPanel} />
              </div>
            </div>
          ) : (
            flamegraphRenderer
          )}
        </Panel>
      </PageContentWrapper>
    </div>
  );
}

export default ContinuousSingleView;
