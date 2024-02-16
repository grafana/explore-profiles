import { Spinner } from '@grafana/ui';
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

export function SingleView() {
  const { data, actions } = useSingleView();

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
        {/* we always display the timeline */}
        <Timeline timeRange={data.timeRange} timeline={data.timeline} onSelectTimeRange={actions.setTimeRange} />
      </Panel>

      <Panel title={data.isLoading ? <Spinner /> : null} isLoading={data.isLoading}>
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
        {/* we don't always display the flamegraph */}
        {!data.fetchDataError && !data.noDataAvailable && data.profile && (
          <FlameGraph
            profile={data.profile}
            enableFlameGraphDotComExport={data.settings?.enableFlameGraphDotComExport}
            collapsedFlamegraphs={data.settings?.collapsedFlamegraphs}
          />
        )}
      </Panel>
    </>
  );
}
