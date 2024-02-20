import { Button, Dropdown } from '@grafana/ui';
import { FlamebearerProfile } from '@shared/types/FlamebearerProfile';
import React from 'react';

import { ExportMenu } from './ExportMenu';

export type ExportDataProps = {
  profile: FlamebearerProfile;
  enableFlameGraphDotComExport?: boolean;
};

export function ExportData(props: ExportDataProps) {
  const { profile, enableFlameGraphDotComExport } = props;

  return (
    <Dropdown overlay={<ExportMenu profile={profile} enableFlameGraphDotComExport={enableFlameGraphDotComExport} />}>
      <Button icon={'download-alt'} size={'sm'} variant={'secondary'} fill={'outline'} aria-label="Export data" />
    </Dropdown>
  );
}
