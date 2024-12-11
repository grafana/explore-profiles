import { LoadingState } from '@grafana/data';
import { sceneGraph, SceneQueryRunner } from '@grafana/scenes';

export function withPreventInvalidQuery(queryRunner: SceneQueryRunner) {
  queryRunner.addActivationHandler(() => {
    if (!sceneGraph.interpolate(queryRunner, '$profileMetricId')) {
      queryRunner.setState({
        queries: [{ refId: 'null' }],
        data: buildErrorData(queryRunner, 'Missing profile type!'),
      });
      return;
    }

    if (!sceneGraph.interpolate(queryRunner, '$serviceName')) {
      queryRunner.setState({
        queries: [{ refId: 'null' }],
        data: buildErrorData(queryRunner, 'Missing service name!'),
      });
    }
  });

  return queryRunner;
}

const buildErrorData = (queryRunner: SceneQueryRunner, errorMsg: string) => ({
  state: LoadingState.Error,
  errors: [new Error(errorMsg)],
  series: [],
  timeRange: sceneGraph.getTimeRange(queryRunner).state.value,
});
