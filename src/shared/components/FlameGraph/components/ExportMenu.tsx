import { Menu } from '@grafana/ui';
import React from 'react';

import { useExportMenu } from './domain/useExportMenu';
import { ExportDataProps } from './ExportData';

export function ExportMenu(props: ExportDataProps) {
  const { data, actions } = useExportMenu(props);

  return (
    <Menu>
      <Menu.Item label="png" onClick={actions.downloadPng} />
      <Menu.Item label="json" onClick={actions.downloadJson} />
      {/* no pprof export, as the underlying API only accepts a single query (see PprofApiClient) */}
      {data.shouldDisplayFlamegraphDotCom && (
        <Menu.Item label="flamegraph.com (public URL)" onClick={actions.uploadToFlamegraphDotCom} />
      )}
    </Menu>
  );
}
