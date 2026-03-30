import { t } from '@grafana/i18n';
import { Menu } from '@grafana/ui';
import React from 'react';

import { useExportMenu } from './domain/useExportMenu';
import { ExportDataProps } from './ExportData';

export function ExportMenu(props: ExportDataProps) {
  const { actions } = useExportMenu(props);

  return (
    <Menu>
      <Menu.Item label={t('export-menu.png-label', 'png')} onClick={actions.downloadPng} />
      <Menu.Item label={t('export-menu.json-label', 'json')} onClick={actions.downloadJson} />
    </Menu>
  );
}
