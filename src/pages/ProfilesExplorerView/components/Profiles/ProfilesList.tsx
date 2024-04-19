import { TimeRange } from '@grafana/data';
import { Services } from '@shared/infrastructure/services/servicesApiClient';
import React from 'react';

import { SceneProfiles } from './SceneProfiles';

type ProfilesProps = {
  timeRange: TimeRange;
  services: Services;
};

export function ProfilesListComponent({ timeRange, services }: ProfilesProps) {
  const profilesScene = new SceneProfiles(timeRange, services);

  return <profilesScene.Component model={profilesScene} />;
}

export const ProfilesList = React.memo(ProfilesListComponent);
