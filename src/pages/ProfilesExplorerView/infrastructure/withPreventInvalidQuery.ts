import { LoadingState } from '@grafana/data';
import { sceneGraph, SceneQueryRunner } from '@grafana/scenes';
import { parseQuery } from '@shared/domain/url-params/parseQuery';
import { logger } from '@shared/infrastructure/tracking/logger';

/**
 * Checks if the label selector has valid filters (either service_name or hierarchy filters)
 * Returns true if the query has at least one meaningful filter
 */
function hasValidFilters(interpolatedSelector: string): boolean {
  // Check for service_name
  if (/service_name="[^"]+"/.test(interpolatedSelector)) {
    return true;
  }

  // Check for any label filter (format: label_name="value")
  // Exclude $filters variable placeholder and empty values
  const labelFilterRegex = /([a-zA-Z_][a-zA-Z0-9_]*)="([^"]+)"/g;
  let match;
  while ((match = labelFilterRegex.exec(interpolatedSelector)) !== null) {
    const [, labelName] = match;
    // Skip internal labels and variable placeholders
    if (!labelName.startsWith('__') && !labelName.startsWith('$')) {
      return true;
    }
  }

  return false;
}

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

    const interpolatedSelector = sceneGraph.interpolate(queryRunner, labelSelector);

    // Check for valid filters (service_name or hierarchy filters)
    if (!hasValidFilters(interpolatedSelector)) {
      const parsed = parseQuery(sceneGraph.interpolate(queryRunner, `$profileTypeId${labelSelector})`));

      // Only show error if there's truly no service identifier
      if (!parsed.serviceId) {
        queryRunner.setState({
          queries: [{ refId: 'null' }],
          data: buildErrorData(queryRunner, 'Missing service name!'),
        });
      }
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
