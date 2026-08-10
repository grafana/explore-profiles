import { t } from '@grafana/i18n';
import {
  AdHocFiltersVariable,
  SceneComponentProps,
  sceneGraph,
  SceneObjectBase,
  SceneObjectState,
} from '@grafana/scenes';
import { Combobox, ComboboxOption } from '@grafana/ui';
import { reportInteraction } from '@shared/domain/reportInteraction';
import React from 'react';

import { ProfileMetricVariable } from '../../domain/variables/ProfileMetricVariable';
import { ProfilesDataSourceVariable } from '../../domain/variables/ProfilesDataSourceVariable';
import { ServiceNameVariable } from '../../domain/variables/ServiceNameVariable/ServiceNameVariable';
import { SpanSelectorVariable } from '../../domain/variables/SpanSelectorVariable';
import { RemoveSpanSelector } from '../SceneExploreServiceFlameGraph/domain/events/RemoveSpanSelector';
import { fetchSpanIdOptions } from './domain/fetchSpanIdOptions';

interface SceneSpanIdFilterState extends SceneObjectState {
  // Mirrored from the spanSelector variable so writes from the heatmap or exemplar table re-render the input.
  spanId: string | null;
  options: Array<ComboboxOption<string>>;
  isLoading: boolean;
}

/**
 * Flame graph header span ID filter (#1053); lives in the panel header because it scopes only the flame graph.
 */
export class SceneSpanIdFilter extends SceneObjectBase<SceneSpanIdFilterState> {
  private fetchRequestId = 0;

  constructor() {
    super({
      key: 'spanIdFilter',
      spanId: null,
      options: [],
      isLoading: false,
    });

    this.addActivationHandler(this.onActivate.bind(this));
  }

  onActivate() {
    // Anything can clear the span — the panel-header chip, the heatmap, a service or profile type
    // change. Mirror the variable into our own state so every one of those re-renders the input.
    const spanSelector = sceneGraph.findByKeyAndType(this, 'spanSelector', SpanSelectorVariable);

    this.setState({ spanId: (spanSelector.state.value as string) || null });

    const spanSelectorSub = spanSelector.subscribeToState((newState, prevState) => {
      if (newState.value !== prevState.value) {
        this.setState({ spanId: (newState.value as string) || null });
      }
    });

    // The set of span IDs is scoped by everything that scopes the profile query, so refetch when
    // any of it changes.
    const timeRangeSub = sceneGraph.getTimeRange(this).subscribeToState(() => {
      this.fetchOptions();
    });

    const dataSourceSub = sceneGraph
      .findByKeyAndType(this, 'dataSource', ProfilesDataSourceVariable)
      .subscribeToState((newState, prevState) => {
        if (newState.value !== prevState.value) {
          this.fetchOptions();
        }
      });

    const serviceNameSub = sceneGraph
      .findByKeyAndType(this, 'serviceName', ServiceNameVariable)
      .subscribeToState((newState, prevState) => {
        if (newState.value !== prevState.value) {
          this.fetchOptions();
        }
      });

    const profileMetricSub = sceneGraph
      .findByKeyAndType(this, 'profileMetricId', ProfileMetricVariable)
      .subscribeToState((newState, prevState) => {
        if (newState.value !== prevState.value) {
          this.fetchOptions();
        }
      });

    // Looked up by name and typed as the base AdHocFiltersVariable rather than the app's subclass:
    // importing that subclass drags SavedSearches, and through it the whole explorer, in here.
    const filtersVariable = sceneGraph.lookupVariable('filters', this) as AdHocFiltersVariable | undefined;
    const filtersSub = filtersVariable?.subscribeToState((newState, prevState) => {
      if (JSON.stringify(newState.filters) !== JSON.stringify(prevState.filters)) {
        this.fetchOptions();
      }
    });

    this.fetchOptions();

    return () => {
      this.fetchRequestId++;
      spanSelectorSub.unsubscribe();
      timeRangeSub.unsubscribe();
      dataSourceSub.unsubscribe();
      serviceNameSub.unsubscribe();
      profileMetricSub.unsubscribe();
      filtersSub?.unsubscribe();
    };
  }

  async fetchOptions() {
    const requestId = ++this.fetchRequestId;

    this.setState({ isLoading: true });

    try {
      const options = await fetchSpanIdOptions(this);

      if (requestId === this.fetchRequestId) {
        this.setState({ options, isLoading: false });
      }
    } catch {
      // A service with no span profiles is the common case, not an error worth surfacing: the
      // dropdown just has nothing to offer.
      if (requestId === this.fetchRequestId) {
        this.setState({ options: [], isLoading: false });
      }
    }
  }

  onChange = (option: ComboboxOption<string> | null) => {
    if (!option?.value) {
      this.publishEvent(new RemoveSpanSelector({}), true);
      return;
    }

    reportInteraction('g_pyroscope_app_span_id_filter_changed', { source: 'dropdown' });
    sceneGraph.findByKeyAndType(this, 'spanSelector', SpanSelectorVariable).changeValueTo(option.value);
  };

  static Component = ({ model }: SceneComponentProps<SceneSpanIdFilter>) => {
    const { options, isLoading, spanId } = model.useState();

    // Hide the input until there is a span to show or options to pick — "no options" noise otherwise.
    if (!spanId && options.length === 0) {
      return null;
    }

    return (
      <Combobox
        // Remount on value change: Combobox seeds its display text at mount.
        key={spanId ?? 'empty'}
        id="span-id-filter"
        data-testid="span-id-filter"
        placeholder={t('span-id-filter.placeholder', 'Filter by span ID')}
        noOptionsMessage={t('span-id-filter.no-options', 'No span profiles in the current time range')}
        options={options}
        loading={isLoading}
        value={spanId}
        isClearable
        createCustomValue
        // Matches the profile type picker beside it (ProfileMetricVariable).
        width={24}
        onChange={model.onChange}
      />
    );
  };
}
