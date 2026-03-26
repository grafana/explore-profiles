import type { SceneQueryRunner } from '@grafana/scenes';

/**
 * Schedules queryRunner.runQueries() after the next animation frame and a
 * subsequent macrotask so scene variables are interpolated before the request
 * runs (avoids empty/error first load on flame graph and metrics runners).
 *
 * Returns a cleanup function: call it on effect teardown or scene deactivate
 * to cancel the scheduled rAF/timeout so runQueries never fires after unmount.
 *
 * refId === 'null' means the runner was already invalidated (e.g. by
 * withPreventInvalidQuery). We skip scheduling in that case, and we check
 * again inside the timeout because activation handlers can null the runner
 * between schedule and run.
 */
export function deferSceneQueryRunnerRun(queryRunner: SceneQueryRunner | undefined): () => void {
  if (!queryRunner || queryRunner.state.queries?.[0]?.refId === 'null') {
    return () => {};
  }
  let animationFrameId = 0;
  let timeoutId = 0;
  animationFrameId = requestAnimationFrame(() => {
    timeoutId = window.setTimeout(() => {
      // Re-check: activation may have set refId to 'null' before this runs.
      if (queryRunner.state.queries?.[0]?.refId !== 'null') {
        queryRunner.runQueries();
      }
    }, 0);
  });
  return () => {
    cancelAnimationFrame(animationFrameId);
    clearTimeout(timeoutId);
  };
}
