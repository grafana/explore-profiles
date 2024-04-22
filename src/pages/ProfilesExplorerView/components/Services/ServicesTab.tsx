import { TimeRange } from '@grafana/data';
import { Services as TServices } from '@shared/infrastructure/services/servicesApiClient';
import React from 'react';

import { SceneServices } from './SceneServices';

type ServicesProps = {
  timeRange: TimeRange;
  services: TServices;
};

function ServicesTabComponent({ timeRange, services }: ServicesProps) {
  const servicesScene = new SceneServices(timeRange, services);

  return <servicesScene.Component model={servicesScene} />;
}

export const ServicesTab = React.memo(ServicesTabComponent);
