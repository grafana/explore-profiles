import { TimeRange } from '@grafana/data';
import { Services } from '@shared/infrastructure/services/servicesApiClient';
import React from 'react';

import { SceneProfiles } from './SceneProfiles';

type ProfilesTabProps = {
  timeRange: TimeRange;
  services: Services;
};

export function ProfilesTabComponent({ timeRange, services }: ProfilesTabProps) {
  const profilesScene = new SceneProfiles(timeRange, services);

  return <profilesScene.Component model={profilesScene} />;
}

export const ProfilesTab = React.memo(ProfilesTabComponent);
