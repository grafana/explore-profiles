import React from 'react';
import PyroscopeExportData, { ExportDataProps } from 'grafana-pyroscope/public/app/components/ExportData';
import { PluginMeta, usePluginContext } from '@grafana/data';
import { AppPluginSettings } from '../../types/plugin';

export default function ExportData(props: ExportDataProps) {
  const { meta } = usePluginContext();
  const exportFlamegraphDotCom = (meta as PluginMeta<AppPluginSettings>).jsonData?.enableFlameGraphDotComExport ?? true;

  const fullProps = {
    ...props,
    exportFlamegraphDotCom,
  };

  return <PyroscopeExportData {...fullProps} />;
}
