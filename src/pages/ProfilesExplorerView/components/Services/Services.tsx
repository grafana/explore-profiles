import { TimeRange } from '@grafana/data';
import { Services as TServices } from '@shared/infrastructure/services/servicesApiClient';
import React from 'react';

import { ServicesExplorer } from './ServicesExplorer';

type ServicesProps = {
  timeRange: TimeRange;
  services: TServices;
};

function ServicesComponent({ timeRange, services }: ServicesProps) {
  const servicesExplorer = new ServicesExplorer(timeRange, services);

  return <servicesExplorer.Component model={servicesExplorer} />;
}

export const Services = React.memo(ServicesComponent);
