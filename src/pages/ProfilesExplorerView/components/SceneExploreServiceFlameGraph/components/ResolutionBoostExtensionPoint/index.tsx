import { usePluginComponent } from '@grafana/runtime';
import { sceneGraph } from '@grafana/scenes';
import React from 'react';

import { SceneExploreServiceFlameGraph } from '../../SceneExploreServiceFlameGraph';

type ResolutionBoostExtensionProps = {
  serviceName: string;
  datasourceUID: string;
};

const SERVICE_NAME_EXPR = '${serviceName}';
const DATASOURCE_UID_EXPR = '${dataSource}';

export function ResolutionBoostExtensionPoint({ scene }: { scene: SceneExploreServiceFlameGraph }) {
  const { component: ResolutionBoostExtension } = usePluginComponent<ResolutionBoostExtensionProps>(
    'grafana-adaptiveprofiles-app/resolution-boost/v1'
  );

  if (!ResolutionBoostExtension) {
    return;
  }

  const serviceName = sceneGraph.interpolate(scene, '${serviceName}');
  // serviceNameUnavailable if the interpolation failed (returning the EXPR back again)
  const serviceNameUnavailable = serviceName === SERVICE_NAME_EXPR;

  if (serviceNameUnavailable) {
    return;
  }

  const datasourceUID = sceneGraph.interpolate(scene, '${DATASOURCE_UID_EXPR}');
  // datasourceUIDUnavailable if the interpolation failed (returning the EXPR back again)
  const datasourceUIDUnavailable = datasourceUID === DATASOURCE_UID_EXPR;

  if (datasourceUIDUnavailable) {
    return;
  }

  return <ResolutionBoostExtension serviceName={serviceName} datasourceUID={datasourceUID} />;
}
