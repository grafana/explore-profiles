import { Button, Dropdown } from '@grafana/ui';
import { FlamebearerProfile } from '@shared/types/FlamebearerProfile';
import React, { memo } from 'react';

import { ExportMenu } from './ExportMenu';

export type ExportDataProps = {
  profile: FlamebearerProfile;
  enableFlameGraphDotComExport?: boolean;
};

function ExportDataComponent(props: ExportDataProps) {
  const { profile, enableFlameGraphDotComExport } = props;

  return (
    <Dropdown overlay={<ExportMenu profile={profile} enableFlameGraphDotComExport={enableFlameGraphDotComExport} />}>
      <Button
        icon="download-alt"
        size="sm"
        variant="secondary"
        fill="outline"
        aria-label="Export profile data"
        tooltip="Export profile data"
      />
    </Dropdown>
  );
}

export const ExportData = memo(ExportDataComponent);
