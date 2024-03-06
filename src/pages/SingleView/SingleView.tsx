import { css } from '@emotion/css';
import { Spinner, useStyles2 } from '@grafana/ui';
import { AiPanel } from '@shared/components/AiPanel/AiPanel';
import { ExplainFlameGraphButton } from '@shared/components/AiPanel/components/ExplainFlameGraphButton';
import { useToggleSidePanel } from '@shared/components/AiPanel/domain/useToggleSidePanel';
import { FlameGraph } from '@shared/components/FlameGraph/FlameGraph';
import { InlineBanner } from '@shared/components/InlineBanner';
import { Panel } from '@shared/components/Panel';
import { QueryBuilder } from '@shared/components/QueryBuilder/QueryBuilder';
import { Toolbar } from '@shared/components/Toolbar/Toolbar';
import { displayWarning } from '@shared/domain/displayStatus';
import React from 'react';

import { useSingleView } from './domain/useSingleView';
import { PageTitle } from './ui/PageTitle';
import { Timeline } from './ui/Timeline/Timeline';

const getStyles = () => ({
  flex: css`
    display: flex;
  `,
  flamegraphPanel: css`
    min-width: 0;
    flex-grow: 1;
  `,
  sidePanel: css`
    flex: 1 0 50%;
    margin-left: 4px;
    padding-left: 4px;
  `,
});

export function SingleView() {
  const styles = useStyles2(getStyles);
  const { data, actions } = useSingleView();
  const { isOpen: isSidePanelOpen, open: openSidePanel, close: closeSidePanel } = useToggleSidePanel();

  if (data.fetchSettingsError) {
    displayWarning([
      'Error while retrieving the plugin settings!',
      'Some features might not work as expected (e.g. flamegraph export options). Please try to reload the page, sorry for the inconvenience.',
    ]);

    console.error(data.fetchSettingsError);
  }

  return (
    <>
      <PageTitle title="Single" />

      <Toolbar isLoading={data.isLoading} onRefresh={actions.refresh} />

      <QueryBuilder
        id="query-builder-single"
        query={data.query}
        // FIXME
        from={data.timeRange.from.unix() * 1000}
        until={data.timeRange.to.unix() * 1000}
        onChangeQuery={actions.setQuery}
      />

      <Panel title={data.timelinePanelTitle} isLoading={data.isLoading}>
        {data.fetchDataError && (
          <InlineBanner severity="error" title="Error while loading timeline data!" error={data.fetchDataError} />
        )}
        {data.noDataAvailable && (
          <InlineBanner
            severity="warning"
            title="No data available"
            message="Please verify that you've selected a proper service, profile type and time range."
          />
        )}
        {/* we always display the timeline to prevent layout shifts */}
        <Timeline timeRange={data.timeRange} timeline={data.timeline} onSelectTimeRange={actions.setTimeRange} />
      </Panel>

      <div className={styles.flex}>
        <Panel
          className={styles.flamegraphPanel}
          title={data.isLoading ? <Spinner /> : null}
          isLoading={data.isLoading}
          headerActions={
            !isSidePanelOpen ? <ExplainFlameGraphButton onClick={openSidePanel} disabled={data.isLoading} /> : null
          }
        >
          {data.fetchDataError && (
            <InlineBanner severity="error" title="Error while loading flamegraph data!" error={data.fetchDataError} />
          )}
          {data.noDataAvailable && (
            <InlineBanner
              severity="warning"
              title="No data available"
              message="Please verify that you've selected a proper service, profile type and time range."
            />
          )}
          {/* we don't always display the flamegraph because if there's no data, the UI does not look good */}
          {/* we probably should open a PR in the @grafana/flamegraph repo to improve this */}
          {data.shouldDisplayFlamegraph && (
            <FlameGraph
              profile={data.profile}
              enableFlameGraphDotComExport={data.settings?.enableFlameGraphDotComExport}
              collapsedFlamegraphs={data.settings?.collapsedFlamegraphs}
            />
          )}
        </Panel>

        {isSidePanelOpen && <AiPanel className={styles.sidePanel} onClose={closeSidePanel} />}
      </div>
    </>
  );
}
