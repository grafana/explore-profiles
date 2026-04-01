import { t } from '@grafana/i18n';
import { config } from '@grafana/runtime';
import {
  dataLayers,
  SceneDataLayerSet,
  sceneGraph,
  SceneObjectBase,
  SceneObjectRef,
  SceneObjectState,
} from '@grafana/scenes';
import { DataQuery } from '@grafana/schema';

import { KgAnnotationToggle } from './KgAnnotationToggle';

const KG_DATASOURCE_TYPE = 'grafana-knowledgegraph-datasource';
const KG_DATASOURCE_UID = 'grafanacloud-knowledgegraph';

interface KgSceneProps {
  $data: SceneDataLayerSet;
  behaviors: KgAnnotationBehavior[];
  controls: KgAnnotationToggle;
}

export function isKgAnnotationsAvailable(): boolean {
  if (!(config.featureToggles as Record<string, boolean | undefined>)['kgAnnotationsInPyroscope']) {
    return false;
  }
  return Object.values(config.datasources).some((d) => d.uid === KG_DATASOURCE_UID);
}

function createAnnotationLayers(entityType: string, entityName: string) {
  const severities = [
    { value: 'critical', color: 'red', label: t('profiles.kg-annotations.severity-critical', 'Critical') },
    { value: 'warning', color: 'yellow', label: t('profiles.kg-annotations.severity-warning', 'Warning') },
    { value: 'info', color: 'blue', label: t('profiles.kg-annotations.severity-info', 'Info') },
  ];

  const filterCriteria = [
    {
      entityType,
      propertyMatchers: [{ id: -1, name: 'name', op: '=', value: entityName, type: 'String' }],
    },
  ];

  return severities.map(
    (s) =>
      new dataLayers.AnnotationsDataLayer({
        name: `Insights - ${s.label}`,
        isEnabled: true,
        isHidden: true,
        query: {
          datasource: { type: KG_DATASOURCE_TYPE, uid: KG_DATASOURCE_UID },
          enable: true,
          iconColor: s.color,
          name: `KG Assertions - ${s.label}`,
          target: {
            refId: `kgAnnotations-${s.value}`,
            queryType: 'annotations',
            queryMode: 'advanced',
            severityFilter: [s.value],
            advancedQuery: { filterCriteria },
          } as unknown as DataQuery,
        },
      })
  );
}

/** Exploration types where a single service is selected and annotations are relevant. */
const SERVICE_EXPLORATION_TYPES = new Set(['profiles', 'labels', 'flame-graph', 'diff-flame-graph']);

interface KgAnnotationBehaviorState extends SceneObjectState {
  layerSet: SceneObjectRef<SceneDataLayerSet>;
  toggle: SceneObjectRef<KgAnnotationToggle>;
  entityType: string;
  serviceNameVarKey: string;
}

class KgAnnotationBehavior extends SceneObjectBase<KgAnnotationBehaviorState> {
  private currentLookupKey: string | undefined;

  constructor(state: KgAnnotationBehaviorState) {
    super(state);
    this.addActivationHandler(this._onActivate);
  }

  private _onActivate = () => {
    const serviceNameVar = sceneGraph.lookupVariable(this.state.serviceNameVarKey, this);
    if (!serviceNameVar) {
      return;
    }

    this.updateLayers(serviceNameVar);

    const subs = [
      serviceNameVar.subscribeToState(() => {
        this.updateLayers(serviceNameVar);
      }),
    ];

    // Subscribe to the parent scene's explorationType to clear layers on views without a single service
    const parent = this.parent;
    if (parent) {
      subs.push(
        parent.subscribeToState(() => {
          this.updateLayers(serviceNameVar);
        })
      );
    }

    return () => {
      subs.forEach((s) => s.unsubscribe());
    };
  };

  private updateLayers(serviceNameVar: ReturnType<typeof sceneGraph.lookupVariable>) {
    const serviceName = serviceNameVar?.getValue() as string;
    const explorationType = (this.parent?.state as { explorationType?: string })?.explorationType;
    const isServiceView = explorationType != null && SERVICE_EXPLORATION_TYPES.has(explorationType);

    const lookupKey = isServiceView ? serviceName || '' : '';

    if (lookupKey === this.currentLookupKey) {
      return;
    }
    this.currentLookupKey = lookupKey;

    const layerSet = this.state.layerSet.resolve();
    const toggle = this.state.toggle.resolve();

    if (isServiceView && serviceName) {
      const layers = createAnnotationLayers(this.state.entityType, serviceName);
      layerSet.setState({ layers });
      toggle.syncLayerEnabledState();
    } else {
      layerSet.setState({ layers: [] });
    }
  }
}

export function getKgSceneProps(entityType: string, serviceNameVarKey: string): KgSceneProps | undefined {
  if (!isKgAnnotationsAvailable()) {
    return undefined;
  }

  const layerSet = new SceneDataLayerSet({ name: 'Insights', layers: [] });

  const toggle = new KgAnnotationToggle({
    isEnabled: true,
    layerSetRef: new SceneObjectRef(layerSet),
  });

  const behavior = new KgAnnotationBehavior({
    layerSet: new SceneObjectRef(layerSet),
    toggle: new SceneObjectRef(toggle),
    entityType,
    serviceNameVarKey,
  });

  return {
    $data: layerSet,
    behaviors: [behavior],
    controls: toggle,
  };
}
