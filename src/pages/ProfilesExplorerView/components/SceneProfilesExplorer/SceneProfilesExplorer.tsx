import { css } from '@emotion/css';
import { AdHocVariableFilter } from '@grafana/data';
import {
  EmbeddedSceneState,
  SceneComponentProps,
  sceneGraph,
  SceneObject,
  SceneObjectBase,
  SceneObjectUrlSyncConfig,
  SceneObjectUrlValues,
  SceneRefreshPicker,
  SceneTimePicker,
  SceneTimeRange,
  sceneUtils,
  SceneVariableSet,
  SplitLayout,
} from '@grafana/scenes';
import { useStyles2 } from '@grafana/ui';
import { displayError } from '@shared/domain/displayStatus';
import { prepareHistoryEntry } from '@shared/domain/prepareHistoryEntry';
import { reportInteraction } from '@shared/domain/reportInteraction';
import { DomainHookReturnValue } from '@shared/types/DomainHookReturnValue';
import React, { useState } from 'react';

import { SceneExploreAllServices } from '../../components/SceneExploreAllServices/SceneExploreAllServices';
import { SceneExploreFavorites } from '../../components/SceneExploreFavorites/SceneExploreFavorites';
import { SceneExploreServiceLabels } from '../../components/SceneExploreServiceLabels/SceneExploreServiceLabels';
import { SceneExploreServiceProfileTypes } from '../../components/SceneExploreServiceProfileTypes/SceneExploreServiceProfileTypes';
import { getDefaultTimeRange } from '../../domain/buildTimeRange';
import { EventViewDiffFlameGraph } from '../../domain/events/EventViewDiffFlameGraph';
import { EventViewServiceFlameGraph } from '../../domain/events/EventViewServiceFlameGraph';
import { EventViewServiceLabels } from '../../domain/events/EventViewServiceLabels';
import { EventViewServiceProfiles } from '../../domain/events/EventViewServiceProfiles';
import { FiltersVariable } from '../../domain/variables/FiltersVariable/FiltersVariable';
import { GroupByVariable } from '../../domain/variables/GroupByVariable/GroupByVariable';
import { ProfileMetricVariable } from '../../domain/variables/ProfileMetricVariable';
import { ProfilesDataSourceVariable } from '../../domain/variables/ProfilesDataSourceVariable';
import { ServiceNameVariable } from '../../domain/variables/ServiceNameVariable/ServiceNameVariable';
import { SpanSelectorVariable } from '../../domain/variables/SpanSelectorVariable';
import { FavoritesDataSource } from '../../infrastructure/favorites/FavoritesDataSource';
import { LabelsDataSource } from '../../infrastructure/labels/LabelsDataSource';
import { SeriesDataSource } from '../../infrastructure/series/SeriesDataSource';
import { SceneLayoutSwitcher } from '../SceneByVariableRepeaterGrid/components/SceneLayoutSwitcher';
import { SceneNoDataSwitcher } from '../SceneByVariableRepeaterGrid/components/SceneNoDataSwitcher';
import { ScenePanelTypeSwitcher } from '../SceneByVariableRepeaterGrid/components/ScenePanelTypeSwitcher';
import { SceneQuickFilter } from '../SceneByVariableRepeaterGrid/components/SceneQuickFilter';
import { GridItemData } from '../SceneByVariableRepeaterGrid/types/GridItemData';
import { SceneCreateRecordingRuleModal } from '../SceneCreateMetricModal/SceneCreateRecordingRuleModal';
import { SceneExploreDiffFlameGraph } from '../SceneExploreDiffFlameGraph/SceneExploreDiffFlameGraph';
import { GitHubContextProvider } from '../SceneExploreServiceFlameGraph/components/SceneFunctionDetailsPanel/components/GitHubContextProvider/GitHubContextProvider';
import { FunctionVersionProvider } from '../SceneExploreServiceFlameGraph/components/SceneFunctionDetailsPanel/domain/FunctionVersionContext';
import { RemoveSpanSelector } from '../SceneExploreServiceFlameGraph/domain/events/RemoveSpanSelector';
import { SceneExploreServiceFlameGraph } from '../SceneExploreServiceFlameGraph/SceneExploreServiceFlameGraph';
import { Header } from './components/Header';

export interface SceneProfilesExplorerState extends Partial<EmbeddedSceneState> {
  $timeRange: SceneTimeRange;
  $variables: SceneVariableSet;
  gridControls: Array<SceneObject & { key?: string }>;
  explorationType?: ExplorationType;
  body?: SplitLayout;
  createRecordingRuleModal: SceneCreateRecordingRuleModal;
  isEmbedded?: boolean;
  initialFilters?: AdHocVariableFilter[];
  initialDS?: string;
}

export enum ExplorationType {
  ALL_SERVICES = 'all',
  PROFILE_TYPES = 'profiles',
  LABELS = 'labels',
  FLAME_GRAPH = 'flame-graph',
  DIFF_FLAME_GRAPH = 'diff-flame-graph',
  FAVORITES = 'favorites',
}

export class SceneProfilesExplorer extends SceneObjectBase<SceneProfilesExplorerState> {
  static EXPLORATION_TYPE_OPTIONS = [
    {
      value: ExplorationType.ALL_SERVICES,
      label: 'All services',
      description: 'Overview of all services, for any given profile type',
    },
    {
      value: ExplorationType.PROFILE_TYPES,
      label: 'Profile types',
      description: 'Overview of all the profile types for a single service',
    },
    {
      value: ExplorationType.LABELS,
      label: 'Labels',
      description: 'Single service label exploration and filtering',
    },
    {
      value: ExplorationType.FLAME_GRAPH,
      label: 'Flame graph',
      description: 'Single service flame graph',
    },
    {
      value: ExplorationType.DIFF_FLAME_GRAPH,
      label: 'Diff flame graph',
      description: 'Compare the differences between two flame graphs',
    },
    {
      value: ExplorationType.FAVORITES,
      label: 'Favorites',
      description: 'Overview of favorited visualizations',
      icon: 'favorite',
    },
  ];

  static DEFAULT_EXPLORATION_TYPE = SceneProfilesExplorer.EXPLORATION_TYPE_OPTIONS[0].value;

  protected _urlSync = new SceneObjectUrlSyncConfig(this, { keys: ['explorationType'] });
  private initialFilters?: AdHocVariableFilter[];

  public constructor(state: Partial<SceneProfilesExplorerState>) {
    super({
      key: 'profiles-explorer',
      explorationType: state.initialFilters && state.initialFilters.length > 0 ? ExplorationType.LABELS : undefined,
      body: undefined,
      $timeRange: state?.$timeRange ?? new SceneTimeRange(getDefaultTimeRange()),
      $variables:
        state?.$variables ??
        new SceneVariableSet({
          // in order to sync with the URL and...
          // ...because of a limitation of the Scenes library, we have to create them now, once, and not every time we set a new exploration type
          // also, we prevent re-creating all variables when switching exploration type, which would lead to unecessary work and layout shifts in the UI
          // (because values would be empty before loading, then populated after fetched)
          // see setExplorationType() for dynamic updates
          variables: [
            new ProfilesDataSourceVariable({ initialDS: state?.initialDS }),
            new ServiceNameVariable({ initialFilters: state?.initialFilters }),
            new ProfileMetricVariable(),
            new FiltersVariable({ key: 'filters' }),
            new FiltersVariable({ key: 'filtersBaseline' }),
            new FiltersVariable({ key: 'filtersComparison' }),
            new GroupByVariable(),
            new SpanSelectorVariable(),
          ],
        }),
      createRecordingRuleModal: new SceneCreateRecordingRuleModal(),
      controls: [new SceneTimePicker({ isOnCanvas: true }), new SceneRefreshPicker({ isOnCanvas: true })],
      // these scenes also sync with the URL so...
      // ...because of a limitation of the Scenes library, we have to create them now, once, and not every time we set a new exploration type
      gridControls: [
        new SceneQuickFilter({ placeholder: '' }),
        new ScenePanelTypeSwitcher(),
        new SceneLayoutSwitcher(),
        new SceneNoDataSwitcher(),
      ],
      isEmbedded: state?.isEmbedded,
    });

    this.registerRuntimeDataSources();

    this.initialFilters = state?.initialFilters;
    this.addActivationHandler(this.onActivate.bind(this));
  }

  onActivate() {
    const varSub = this.subscribeToVariableChanges();
    const eventsSub = this.subscribeToEvents();

    if (!this.state.explorationType) {
      this.setExplorationType({
        type: SceneProfilesExplorer.DEFAULT_EXPLORATION_TYPE,
      });
    }

    return () => {
      eventsSub.unsubscribe();
      varSub.unsubscribe();
    };
  }

  getUrlState() {
    return {
      explorationType: this.state.explorationType,
    };
  }

  updateFromUrl(values: SceneObjectUrlValues) {
    // Don't update from URL if initialFilters are provided - we want to select the LABELS view as we are in embedded mode
    if (this.initialFilters && this.initialFilters.length > 0) {
      this.setExplorationType({ type: ExplorationType.LABELS, comesFromUserAction: false });
      return;
    }

    if (typeof values.explorationType === 'string' && values.explorationType !== this.state.explorationType) {
      const type = values.explorationType as ExplorationType;
      this.setExplorationType({
        type: Object.values(ExplorationType).includes(type) ? type : SceneProfilesExplorer.DEFAULT_EXPLORATION_TYPE,
      });
    }
  }

  registerRuntimeDataSources() {
    // wrapped in a try-catch to prevent error when registered twice, which can easily happen if we go back & forth to the Profiles Explorer page
    try {
      sceneUtils.registerRuntimeDataSource({ dataSource: new SeriesDataSource() });
      sceneUtils.registerRuntimeDataSource({ dataSource: new FavoritesDataSource() });
      sceneUtils.registerRuntimeDataSource({ dataSource: new LabelsDataSource() });
    } catch (error) {
      const { message } = error as Error;

      if (!/A runtime data source with uid (.+) has already been registered/.test(message)) {
        displayError(error as Error, [
          'Fail to register all the runtime data sources!',
          'The application cannot work as expected, please try reloading the page or if the problem persists, contact your organization admin.',
        ]);
      }
    }
  }

  subscribeToVariableChanges() {
    const dataSourceSub = sceneGraph
      .findByKeyAndType(this, 'dataSource', ProfilesDataSourceVariable)
      .subscribeToState((newState, prevState) => {
        if (newState.value && newState.value !== prevState.value) {
          FiltersVariable.resetAll(this);
          this.resetSpanSelector();
        }
      });

    const serviceNameSub = sceneGraph
      .findByKeyAndType(this, 'serviceName', ServiceNameVariable)
      .subscribeToState((newState, prevState) => {
        if (newState.value && newState.value !== prevState.value) {
          FiltersVariable.resetAll(this);
          // This is to prevent removing the span selector if the previous service name was not correct
          // This way a user can still select the service name for selected span in case there's a mismatch
          // in the service name that was provided from the trace
          if (newState.options.some((option) => option.value === prevState.value)) {
            this.resetSpanSelector();
          }
        }
      });

    const profileTypeSub = sceneGraph
      .findByKeyAndType(this, 'profileMetricId', ProfileMetricVariable)
      .subscribeToState((newState, prevState) => {
        if (newState.value && newState.value !== prevState.value) {
          this.resetSpanSelector();
        }
      });

    const filtersSub = sceneGraph
      .findByKeyAndType(this, 'filters', FiltersVariable)
      .subscribeToState((newState, prevState) => {
        if (JSON.stringify(newState.filters) !== JSON.stringify(prevState.filters)) {
          this.resetSpanSelector();
        }
      });

    return {
      unsubscribe() {
        serviceNameSub.unsubscribe();
        dataSourceSub.unsubscribe();
        filtersSub.unsubscribe();
        profileTypeSub.unsubscribe();
      },
    };
  }

  subscribeToEvents() {
    const profilesSub = this.subscribeToEvent(EventViewServiceProfiles, (event) => {
      this.setExplorationType({
        type: ExplorationType.PROFILE_TYPES,
        comesFromUserAction: true,
        item: event.payload.item,
      });
    });

    const labelsSub = this.subscribeToEvent(EventViewServiceLabels, (event) => {
      this.setExplorationType({
        type: ExplorationType.LABELS,
        comesFromUserAction: true,
        item: event.payload.item,
      });
    });

    const flameGraphSub = this.subscribeToEvent(EventViewServiceFlameGraph, (event) => {
      this.setExplorationType({
        type: ExplorationType.FLAME_GRAPH,
        comesFromUserAction: true,
        item: event.payload.item,
      });
    });

    const diffFlameGraphSub = this.subscribeToEvent(EventViewDiffFlameGraph, (event) => {
      const { useAncestorTimeRange, clearDiffRange, baselineFilters, comparisonFilters } = event.payload;

      this.setExplorationType({
        type: ExplorationType.DIFF_FLAME_GRAPH,
        comesFromUserAction: true,
        bodySceneOptions: {
          useAncestorTimeRange,
          clearDiffRange,
          baselineFilters,
          comparisonFilters,
        },
      });
    });

    const removeSpanSelectorSub = this.subscribeToEvent(RemoveSpanSelector, () => {
      this.resetSpanSelector();
    });

    return {
      unsubscribe() {
        diffFlameGraphSub.unsubscribe();
        flameGraphSub.unsubscribe();
        labelsSub.unsubscribe();
        profilesSub.unsubscribe();
        removeSpanSelectorSub.unsubscribe();
      },
    };
  }

  setExplorationType({
    type,
    comesFromUserAction,
    item,
    bodySceneOptions,
  }: {
    type: ExplorationType;
    comesFromUserAction?: boolean;
    item?: GridItemData;
    bodySceneOptions?: Record<string, any>;
  }) {
    if (comesFromUserAction) {
      prepareHistoryEntry();
      this.resetVariables(type);
    }

    this.setState({
      explorationType: type,
      body: this.buildBodyScene(type, item, bodySceneOptions),
    });
  }

  resetSpanSelector() {
    sceneGraph.findByKeyAndType(this, 'spanSelector', SpanSelectorVariable).reset();
  }

  resetVariables(nextExplorationType: string) {
    sceneGraph.findByKeyAndType(this, 'quick-filter', SceneQuickFilter).reset();
    sceneGraph.findByKeyAndType(this, 'groupBy', GroupByVariable).changeValueTo(GroupByVariable.DEFAULT_VALUE);
    sceneGraph.findByKeyAndType(this, 'panel-type-switcher', ScenePanelTypeSwitcher).reset();
    this.resetSpanSelector();

    // preserve existing filters only when switching to "Labels", "Flame graph" or "Diff flame graph"
    // if not, they will be added to the queries without any notice on the UI
    if (
      ![ExplorationType.LABELS, ExplorationType.FLAME_GRAPH, ExplorationType.DIFF_FLAME_GRAPH].includes(
        nextExplorationType as ExplorationType
      )
    ) {
      sceneGraph.findByKeyAndType(this, 'filters', FiltersVariable).reset();
    }
  }

  buildBodyScene(explorationType: ExplorationType, item?: GridItemData, bodySceneOptions?: Record<string, any>) {
    let primary;

    switch (explorationType) {
      case ExplorationType.PROFILE_TYPES:
        primary = new SceneExploreServiceProfileTypes({ item });
        break;

      case ExplorationType.LABELS:
        primary = new SceneExploreServiceLabels({ item });
        break;

      case ExplorationType.FLAME_GRAPH:
        primary = new SceneExploreServiceFlameGraph({ item });
        break;

      case ExplorationType.DIFF_FLAME_GRAPH:
        primary = new SceneExploreDiffFlameGraph(bodySceneOptions || {});
        break;

      case ExplorationType.FAVORITES:
        primary = new SceneExploreFavorites();
        break;

      case ExplorationType.ALL_SERVICES:
      default:
        primary = new SceneExploreAllServices();
    }

    return new SplitLayout({
      direction: 'column',
      primary,
    });
  }

  onChangeExplorationType = (explorationType: string) => {
    reportInteraction('g_pyroscope_app_exploration_type_clicked', { explorationType });

    this.setExplorationType({
      type: explorationType as ExplorationType,
      comesFromUserAction: true,
    });
  };

  useProfilesExplorer = (): DomainHookReturnValue => {
    const { explorationType, controls, body, $variables } = this.useState();

    const dataSourceVariable = $variables.state.variables[0] as ProfilesDataSourceVariable;
    const dataSourceUid = dataSourceVariable.useState().value as string;

    return {
      data: {
        explorationType,
        controls,
        body,
        $variables,
        dataSourceUid,
      },
      actions: {
        onChangeExplorationType: this.onChangeExplorationType,
      },
    };
  };

  static Component({ model }: SceneComponentProps<SceneProfilesExplorer>) {
    const styles = useStyles2(getStyles); // eslint-disable-line react-hooks/rules-of-hooks

    const { data, actions } = model.useProfilesExplorer();
    const { explorationType, controls, body, $variables, dataSourceUid } = data;

    // eslint-disable-next-line react-hooks/rules-of-hooks
    const [recordingRulesModalState, setRecordingRulesModalState] = useState<{
      isOpen: boolean;
      functionName?: string;
    }>({ isOpen: false });
    const { createRecordingRuleModal, isEmbedded } = model.useState();

    return (
      <FunctionVersionProvider>
        <GitHubContextProvider dataSourceUid={dataSourceUid}>
          <Header
            explorationType={explorationType}
            controls={controls}
            body={body}
            $variables={$variables}
            onChangeExplorationType={actions.onChangeExplorationType}
            isEmbedded={isEmbedded}
            onCreateRecordingRule={() => {
              setRecordingRulesModalState({ isOpen: true });
            }}
          />

          <div className={styles.body} data-testid="sceneBody">
            {body && <body.Component model={body} />}
          </div>

          {recordingRulesModalState.isOpen && (
            <SceneCreateRecordingRuleModal.Component
              model={createRecordingRuleModal}
              isModalOpen={recordingRulesModalState.isOpen}
              functionName={recordingRulesModalState.functionName}
              onDismiss={() => setRecordingRulesModalState({ isOpen: false })}
              onCreated={() => {
                setRecordingRulesModalState({ isOpen: false });
              }}
            />
          )}
        </GitHubContextProvider>
      </FunctionVersionProvider>
    );
  }
}

const getStyles = () => ({
  body: css`
    position: relative;
    z-index: 0;
    background: transparent;
  `,
});
