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
      <Menu.Item label="pprof" onClick={actions.downloadPprof} />
      {data.shouldDisplayFlamegraphDotCom && (
        <Menu.Item label="flamegraph.com" onClick={actions.uploadToFlamegraphDotCom} />
      )}
    </Menu>
  );
}
