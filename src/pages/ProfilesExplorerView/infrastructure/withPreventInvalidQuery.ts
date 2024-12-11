import { LoadingState } from '@grafana/data';
import { sceneGraph, SceneQueryRunner } from '@grafana/scenes';
import { parseQuery } from '@shared/domain/url-params/parseQuery';
import { logger } from '@shared/infrastructure/tracking/logger';

export function withPreventInvalidQuery(queryRunner: SceneQueryRunner) {
  queryRunner.addActivationHandler(() => {
    const { profileTypeId, labelSelector } = queryRunner.state.queries[0];

    if (!profileTypeId) {
      queryRunner.setState({
        queries: [{ refId: 'null' }],
        data: buildErrorData(queryRunner, 'Missing profile type!'),
      });
      return;
    }

    if (!labelSelector) {
      queryRunner.setState({
        queries: [{ refId: 'null' }],
        data: buildErrorData(queryRunner, 'Missing label selector!'),
      });
      return;
    }

    if (!sceneGraph.interpolate(queryRunner, '$profileMetricId')) {
      queryRunner.setState({
        queries: [{ refId: 'null' }],
        data: buildErrorData(queryRunner, 'Missing profile type!'),
      });
      return;
    }

    const parsed = parseQuery(sceneGraph.interpolate(queryRunner, `$profileTypeId${labelSelector})`));

    if (!parsed.serviceId) {
      queryRunner.setState({
        queries: [{ refId: 'null' }],
        data: buildErrorData(queryRunner, 'Missing service name!'),
      });
    }
  });

  return queryRunner;
}

function buildErrorData(queryRunner: SceneQueryRunner, errorMsg: string) {
  const error = new Error(errorMsg);

  logger.error(error);

  return {
    state: LoadingState.Error,
    errors: [error],
    series: [],
    timeRange: sceneGraph.getTimeRange(queryRunner).state.value,
  };
}
