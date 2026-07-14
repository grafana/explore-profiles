import { usePluginComponent } from '@grafana/runtime';
import { sceneGraph, SceneObject } from '@grafana/scenes';
import React from 'react';

type SamplingIndicatorExtensionProps = {
  serviceName: string;
  datasourceUID: string;
};

const SERVICE_NAME_EXPR = '${serviceName}';
const DATASOURCE_UID_EXPR = '${dataSource}';

export function SamplingIndicatorExtensionPoint({ scene }: { scene: SceneObject }) {
  const { component: Extension } = usePluginComponent<SamplingIndicatorExtensionProps>(
    'grafana-adaptiveprofiles-app/adaptive-profiles-indicator/v1'
  );

  if (!Extension) {
    return null;
  }

  const serviceName = sceneGraph.interpolate(scene, SERVICE_NAME_EXPR);
  // interpolation failed if the expression is returned back unchanged
  if (serviceName === SERVICE_NAME_EXPR) {
    return null;
  }

  const datasourceUID = sceneGraph.interpolate(scene, DATASOURCE_UID_EXPR);
  if (datasourceUID === DATASOURCE_UID_EXPR) {
    return null;
  }

  return <Extension datasourceUID={datasourceUID} serviceName={serviceName} />;
}
