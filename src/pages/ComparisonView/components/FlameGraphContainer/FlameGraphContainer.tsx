import { FlameGraph } from '@shared/components/FlameGraph/FlameGraph';
import { InlineBanner } from '@shared/components/InlineBanner';
import React, { useEffect } from 'react';

import { useFlameGraphContainer } from './domain/useFlameGraphContainer';

type FlameGraphContainerProps = {
  target: string;
  onLoadingChange: (isLoading: boolean, hasFlameGraph: boolean) => void;
};

export function FlameGraphContainer({ target, onLoadingChange }: FlameGraphContainerProps) {
  const { data } = useFlameGraphContainer(target);

  useEffect(() => {
    onLoadingChange(data.isLoading, data.shouldDisplayFlamegraph);
  }, [data.isLoading, data.shouldDisplayFlamegraph, onLoadingChange]);

  return (
    <>
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
          vertical={target !== 'diff-profile'}
          diff={target === 'diff-profile'}
          profile={data.profile}
          enableFlameGraphDotComExport={data.settings?.enableFlameGraphDotComExport}
          collapsedFlamegraphs={data.settings?.collapsedFlamegraphs}
        />
      )}
    </>
  );
}
