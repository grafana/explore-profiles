import { ServiceNameVariable } from 'src/pages/ProfilesExplorerView/domain/variables/ServiceNameVariable';

export class ServicesForProfileMetricVariable extends ServiceNameVariable {
  constructor() {
    super({
      name: 'servicesForProfileMetric',
      // "hack": we want to subscribe to changes of dataSource and profileMetricId
      query: '$dataSource, $profileMetricId and serviceName please',
      skipUrlSync: true,
    });
  }
}
