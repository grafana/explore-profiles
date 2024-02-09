import { PageLayoutType } from '@grafana/data';
import { PluginPage } from '@grafana/runtime';
import { Spinner } from '@grafana/ui';
import { FlameGraph } from '@shared/components/FlameGraph/FlameGraph';
import { Panel } from '@shared/components/Panel';
import { QueryBuilder } from '@shared/components/QueryBuilder/QueryBuilder';
import { Toolbar } from '@shared/components/Toolbar/Toolbar';
import { addQueryToPageTitle } from '@shared/domain/addQueryToPageTitle';
import { displayWarning } from '@shared/domain/displayStatus';
import React from 'react';

import { useSingleView } from './domain/useSingleView';
import { ErrorMessage } from './ui/ErrorMessage';
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
    <PluginPage layout={PageLayoutType.Custom}>
      <PageTitle title={addQueryToPageTitle('Single', data.query)} />

      <Toolbar isLoading={data.isLoading} onRefresh={actions.refetch} />

      <QueryBuilder
        id="query-builder-single"
        query={data.query}
        // FIXME
        from={data.timeRange.from.unix() * 1000}
        until={data.timeRange.to.unix() * 1000}
        onChangeQuery={actions.setQuery}
      />

      <Panel title={data.timelinePanelTitle} isLoading={data.isLoading}>
        {data.fetchDataError && <ErrorMessage title="Error while loading timeline data!" error={data.fetchDataError} />}
        <Timeline timeRange={data.timeRange} timeline={data.timeline} onSelectTimeRange={actions.setTimeRange} />
      </Panel>

      <Panel
        title={
          data.isLoading ? (
            <>
              <Spinner inline />
              &nbsp;Loading...
            </>
          ) : null
        }
        isLoading={data.isLoading}
      >
        {data.fetchDataError && (
          <ErrorMessage title="Error while loading flamegraph data!" error={data.fetchDataError} />
        )}
        {data.profile && (
          <FlameGraph
            profile={data.profile}
            enableFlameGraphDotComExport={data.settings?.enableFlameGraphDotComExport}
            collapsedFlamegraphs={data.settings?.collapsedFlamegraphs}
          />
        )}
      </Panel>
    </PluginPage>
  );
}
