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

const LABEL_DEFAULT = 'Span ID';

interface SceneSpanIdFilterState extends SceneObjectState {
  // The toolbar keys, labels and test-ids its controls off `name` and `label`, like a scene variable.
  name: string;
  label: string;
  // Mirrored from the spanSelector variable: the chip, the heatmap and this control all write it, and
  // owning a copy is what re-renders the input when one of the others clears it.
  spanId: string | null;
  options: Array<ComboboxOption<string>>;
  isLoading: boolean;
}

/**
 * Toolbar span ID filter: reads and writes the same `spanSelector` variable as the panel-header chip,
 * but is reachable without first finding a span on the heatmap (#1053).
 */
export class SceneSpanIdFilter extends SceneObjectBase<SceneSpanIdFilterState> {
  private fetchRequestId = 0;

  constructor() {
    super({
      key: 'spanIdFilter',
      name: 'spanId',
      label: LABEL_DEFAULT,
      spanId: null,
      options: [],
      isLoading: false,
    });

    this.addActivationHandler(this.onActivate.bind(this));
  }

  onActivate() {
    // Translated here rather than in the constructor, like the sibling variables do.
    this.setState({ label: t('span-id-filter.label', LABEL_DEFAULT) });

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

    // Always rendered, like the pickers beside it: a control that appears and disappears with the
    // service would shift the row. With no span profiles the dropdown says so instead.
    return (
      <Combobox
        // Combobox keeps the text it displays in internal state seeded at mount, so remount it on
        // every value change to keep the input from showing a span that was cleared elsewhere.
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
