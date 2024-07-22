import { ProfileMetricVariable } from 'src/pages/ProfilesExplorerView/domain/variables/ProfileMetricVariable';

export class ProfileMetricsForServiceVariable extends ProfileMetricVariable {
  constructor() {
    super({
      name: 'profileMetricsForService',
      // "hack": we want to subscribe to changes of dataSource and serviceName
      query: '$dataSource, $serviceName and profileMetricId please',
      skipUrlSync: true,
    });
  }
}
