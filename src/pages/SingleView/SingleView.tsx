import { css } from '@emotion/css';
import { GrafanaTheme2 } from '@grafana/data';
import { Spinner, useStyles2 } from '@grafana/ui';
import { AiPanel } from '@shared/components/AiPanel/AiPanel';
import { AIButton } from '@shared/components/AiPanel/components/AIButton';
import { FlameGraph } from '@shared/components/FlameGraph/FlameGraph';
import { FunctionDetailsPanel } from '@shared/components/FunctionDetailsPanel/FunctionDetailsPanel';
import { InlineBanner } from '@shared/components/InlineBanner';
import { Panel } from '@shared/components/Panel';
import { useQueryAnalysis } from '@shared/components/QueryAnalysisTooltip/domain/useQueryAnalysis';
import { QueryBuilder } from '@shared/components/QueryBuilder/QueryBuilder';
import { SingleTimeline } from '@shared/components/Timeline/SingleTimeline';
import { Toolbar } from '@shared/components/Toolbar/Toolbar';
import { displayWarning } from '@shared/domain/displayStatus';
import { useGitHubIntegration } from '@shared/domain/github-integration/useGitHubIntegration';
import { useToggleSidePanel } from '@shared/domain/useToggleSidePanel';
import { PageTitle } from '@shared/ui/PageTitle';
import React from 'react';

import { useSingleView } from './domain/useSingleView';

const getStyles = (theme: GrafanaTheme2) => ({
  flex: css`
    display: flex;
  `,
  flamegraphPanel: css`
    min-width: 0;
    flex-grow: 1;
  `,
  sidePanel: css`
    flex: 1 0 50%;
    max-width: 50%;
    margin-left: 4px;
    padding-left: 4px;
  `,
  aiButton: css`
    margin-top: ${theme.spacing(1)};
  `,
});

export function SingleView() {
  const styles = useStyles2(getStyles);

  const sidePanel = useToggleSidePanel();
  const gitHubIntegration = useGitHubIntegration(sidePanel);
  const { data, actions } = useSingleView();
  const { queryAnalysis, queriedSeriesInfoText } = useQueryAnalysis();

  if (data.fetchSettingsError) {
    displayWarning([
      'Error while retrieving the plugin settings!',
      'Some features might not work as expected (e.g. flamegraph export options). Please try to reload the page, sorry for the inconvenience.',
    ]);
  }

  return (
    <>
      <PageTitle title="Single view" queryAnalysis={queryAnalysis} />

      <Toolbar
        isLoading={data.isLoading}
        onRefresh={() => {
          actions.refresh();
          sidePanel.close();
        }}
        onChangeTimeRange={actions.setTimeRange}
      />

      <QueryBuilder
        id="query-builder-single"
        query={data.query}
        // FIXME
        from={data.timeRange.from.unix() * 1000}
        until={data.timeRange.to.unix() * 1000}
        onChangeQuery={actions.setQuery}
      />

      <Panel
        title={data.title}
        description={queriedSeriesInfoText}
        isLoading={data.isLoading}
        dataTestId="timeline-panel"
      >
        {data.fetchDataError && (
          <InlineBanner severity="error" title="Error while loading timeline data!" errors={[data.fetchDataError]} />
        )}

        {data.noDataAvailable && (
          <InlineBanner
            severity="warning"
            title="No timeline data available"
            message="Please verify that you've selected a proper service, profile type and time range."
          />
        )}

        {/* we always display the timeline to prevent layout shifts */}
        <SingleTimeline timeRange={data.timeRange} timeline={data.timeline} onSelectTimeRange={actions.setTimeRange} />
      </Panel>

      <div className={styles.flex}>
        <Panel
          className={styles.flamegraphPanel}
          title={data.isLoading ? <Spinner /> : null}
          description={queriedSeriesInfoText}
          isLoading={data.isLoading}
          headerActions={
            <AIButton
              className={styles.aiButton}
              onClick={() => sidePanel.open('ai')}
              disabled={data.isLoading || !data.shouldDisplayFlamegraph || sidePanel.isOpen('ai')}
              interactionName="g_pyroscope_app_explain_flamegraph_clicked"
            >
              Explain Flame Graph
            </AIButton>
          }
          dataTestId="flamegraph-panel"
        >
          {data.fetchDataError && (
            <InlineBanner severity="error" title="Error while loading profile data!" errors={[data.fetchDataError]} />
          )}
          {data.noDataAvailable && (
            <InlineBanner
              severity="warning"
              title="No profile data available"
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
              getExtraContextMenuButtons={gitHubIntegration.actions.getExtraFlameGraphMenuItems}
            />
          )}
        </Panel>

        {sidePanel.isOpen('ai') && <AiPanel className={styles.sidePanel} onClose={sidePanel.close} />}

        {sidePanel.isOpen('function-details') && (
          <FunctionDetailsPanel
            className={styles.sidePanel}
            stacktrace={gitHubIntegration.data.stacktrace}
            onClose={sidePanel.close}
          />
        )}
      </div>
    </>
  );
}
