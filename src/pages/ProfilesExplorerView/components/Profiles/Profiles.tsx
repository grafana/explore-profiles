import { TimeRange } from '@grafana/data';
import { Services } from '@shared/infrastructure/services/servicesApiClient';
import React from 'react';

import { ProfilesExplorer } from './ProfilesExplorer';

type ProfilesProps = {
  timeRange: TimeRange;
  services: Services;
};

export function ProfilesComponent({ timeRange, services }: ProfilesProps) {
  const profilesExplorer = new ProfilesExplorer(timeRange, services);

  return <profilesExplorer.Component model={profilesExplorer} />;
}

export const Profiles = React.memo(ProfilesComponent);
