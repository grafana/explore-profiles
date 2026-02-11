import {
  EmbeddedSceneState,
  SceneComponentProps,
  sceneGraph,
  SceneObjectBase,
  SceneVariableSet,
  VariableValueOption,
} from '@grafana/scenes';
import { useLabelPreset } from '@shared/infrastructure/settings/GroupByLabelsContext';
import React, { useEffect } from 'react';

import { SceneByVariableRepeaterGrid } from '../../components/SceneByVariableRepeaterGrid/SceneByVariableRepeaterGrid';
import { FavAction } from '../../domain/actions/FavAction';
import { SelectAction } from '../../domain/actions/SelectAction';
import { ProfileMetricVariable } from '../../domain/variables/ProfileMetricVariable';
import { ServiceNameVariable } from '../../domain/variables/ServiceNameVariable/ServiceNameVariable';
import { splitCompositeValue } from '../../infrastructure/series/http/formatSeriesResponse';
import { HierarchyFilter } from '../../infrastructure/timeseries/TimeSeriesQueryRunnerParams';
import { SceneLayoutSwitcher } from '../SceneByVariableRepeaterGrid/components/SceneLayoutSwitcher';
import { PanelType } from '../SceneByVariableRepeaterGrid/components/ScenePanelTypeSwitcher';
import { SceneQuickFilter } from '../SceneByVariableRepeaterGrid/components/SceneQuickFilter';
import { GridItemData } from '../SceneByVariableRepeaterGrid/types/GridItemData';

interface SceneExploreAllServicesState extends EmbeddedSceneState {
  configuredPreset?: string;
  presetLabels?: string[];
}

/**
 * Splits a composite value into hierarchy filters based on the preset labels.
 * The composite value is URL-encoded, so values like "my/cluster" are properly handled.
 */
function splitCompositeValueToHierarchyFilters(
  compositeValue: string,
  presetLabels: string[]
): HierarchyFilter[] | undefined {
  // If using default service_name preset, don't use hierarchy filters
  if (presetLabels.length === 1 && presetLabels[0] === 'service_name') {
    return undefined;
  }

  // Use the proper decoder that handles URL-encoded values
  const values = splitCompositeValue(compositeValue);

  // If the number of values doesn't match the preset labels, something is wrong
  if (values.length !== presetLabels.length) {
    return undefined;
  }

  return presetLabels.map((label, index) => ({
    label,
    value: values[index],
  }));
}

/**
 * Creates a mapOptionToItem function that properly handles preset labels
 */
function createMapOptionToItem(presetLabels: string[]) {
  return (
    option: VariableValueOption,
    index: number,
    { profileMetricId }: Record<string, string>
  ): GridItemData | null => {
    const compositeValue = option.value as string;
    const hierarchyFilters = splitCompositeValueToHierarchyFilters(compositeValue, presetLabels);

    // For default preset, use serviceName; for custom presets, use hierarchyFilters
    const isDefaultPreset = presetLabels.length === 1 && presetLabels[0] === 'service_name';

    return {
      index,
      value: compositeValue,
      label: option.label,
      queryRunnerParams: {
        serviceName: isDefaultPreset ? compositeValue : undefined,
        profileMetricId,
        hierarchyFilters,
      },
      panelType: PanelType.TIMESERIES,
    };
  };
}

export class SceneExploreAllServices extends SceneObjectBase<SceneExploreAllServicesState> {
  private static DEFAULT_PRESET_LABELS = ['service_name'];

  constructor() {
    super({
      key: 'explore-all-services',
      configuredPreset: undefined,
      presetLabels: SceneExploreAllServices.DEFAULT_PRESET_LABELS,
      $variables: new SceneVariableSet({
        variables: [
          // Default: use ServiceNameVariable
          // The preset will be applied dynamically when the component renders
          new ServiceNameVariable({
            query: ServiceNameVariable.QUERY_PROFILE_METRIC_DEPENDENT,
            skipUrlSync: true,
          }),
        ],
      }),
      body: new SceneByVariableRepeaterGrid({
        key: 'all-services-grid',
        variableName: 'serviceName',
        mapOptionToItem: createMapOptionToItem(SceneExploreAllServices.DEFAULT_PRESET_LABELS),
        headerActions: (item) => [
          new SelectAction({ type: 'view-profiles', item }),
          new SelectAction({ type: 'view-labels', item }),
          new SelectAction({ type: 'view-flame-graph', item }),
          new FavAction({ item }),
        ],
      }),
    });

    this.addActivationHandler(this.onActivate.bind(this));
  }

  onActivate() {
    sceneGraph
      .findByKeyAndType(this, 'quick-filter', SceneQuickFilter)
      .setPlaceholder('Search (comma-separated regexes are supported)');
  }

  /**
   * Configures the variable and grid to use the specified preset.
   * For the default ['service_name'] preset, uses standard service queries.
   * For custom presets, fetches composite values joined with "/".
   */
  configureForPreset(presetLabels: string[], presetName: string) {
    const presetKey = presetLabels.join(',');

    // Skip if already configured for this preset
    if (this.state.configuredPreset === presetKey) {
      return;
    }

    this.setState({ configuredPreset: presetKey, presetLabels });

    // Update the ServiceNameVariable with the new preset
    const serviceNameVariable = sceneGraph.findByKeyAndType(this, 'serviceName', ServiceNameVariable);
    serviceNameVariable.updatePreset(presetLabels, presetName);

    // Update the grid's mapOptionToItem function to use the new preset labels
    const grid = sceneGraph.findByKeyAndType(this, 'all-services-grid', SceneByVariableRepeaterGrid);
    grid.setState({ mapOptionToItem: createMapOptionToItem(presetLabels) });

    // Update quick filter placeholder
    const itemLabel = presetName || presetLabels.join('/');
    sceneGraph
      .findByKeyAndType(this, 'quick-filter', SceneQuickFilter)
      .setPlaceholder(`Search ${itemLabel} (comma-separated regexes are supported)`);
  }

  // see SceneProfilesExplorer
  getVariablesAndGridControls() {
    return {
      variables: [sceneGraph.findByKeyAndType(this, 'profileMetricId', ProfileMetricVariable)],
      gridControls: [
        sceneGraph.findByKeyAndType(this, 'quick-filter', SceneQuickFilter),
        sceneGraph.findByKeyAndType(this, 'layout-switcher', SceneLayoutSwitcher),
      ],
    };
  }

  static Component({ model }: SceneComponentProps<SceneExploreAllServices>) {
    return <SceneExploreAllServicesContent model={model} />;
  }
}

function SceneExploreAllServicesContent({ model }: { model: SceneExploreAllServices }) {
  const { body } = model.useState();
  const { activePreset, isLoading } = useLabelPreset();

  useEffect(() => {
    if (!isLoading && activePreset.labels.length > 0) {
      model.configureForPreset(activePreset.labels, activePreset.name);
    }
  }, [model, activePreset, isLoading]);

  return <body.Component model={body} />;
}
