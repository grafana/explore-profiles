import { SceneObjectBase, SceneObjectState, SceneVariableSet } from '@grafana/scenes';
import { render, screen } from '@testing-library/react';
import React from 'react';

import { SpanSelectorVariable } from '../../../domain/variables/SpanSelectorVariable';
import { RemoveSpanSelector } from '../../SceneExploreServiceFlameGraph/domain/events/RemoveSpanSelector';
import { SceneSpanIdFilter } from '../SceneSpanIdFilter';

// Fetching options pulls in the heatmap scene, which reaches TransformStream (absent in jsdom). The
// fetching is covered by domain/__tests__/fetchSpanIdOptions.spec.ts.
jest.mock('../domain/fetchSpanIdOptions', () => ({
  fetchSpanIdOptions: jest.fn().mockResolvedValue([]),
}));

jest.mock('@shared/domain/reportInteraction', () => ({
  reportInteraction: jest.fn(),
}));

const { reportInteraction } = jest.requireMock('@shared/domain/reportInteraction');

// Combobox measures option text on a canvas, which jsdom does not implement. Plain assignment to the
// prototype does not stick, hence defineProperty.
beforeAll(() => {
  Object.defineProperty(Object.getPrototypeOf(document.createElement('canvas')), 'getContext', {
    configurable: true,
    writable: true,
    value: () => ({ measureText: () => ({ width: 100 }), font: '' }),
  });
});

class TestScene extends SceneObjectBase<SceneObjectState & { spanIdFilters: SceneSpanIdFilter }> {}

// Not activated: activating a SceneVariableSet validates each variable against its (empty) options
// and would wipe the values, and activating SceneSpanIdFilter would fire a real heatmap query.
function buildScene(values: { span?: string } = {}) {
  const spanIdFilters = new SceneSpanIdFilter();
  const spanSelector = new SpanSelectorVariable();

  spanSelector.setState({ value: values.span });
  // onActivate mirrors the variable into this state for real; the scene here is not activated.
  spanIdFilters.setState({ spanId: values.span ?? null });

  const scene = new TestScene({
    spanIdFilters,
    $variables: new SceneVariableSet({ variables: [spanSelector] }),
  });

  return { scene, spanIdFilters };
}

describe('SceneSpanIdFilter', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('span ID', () => {
    it('writes the picked span into the spanSelector variable', () => {
      const { scene, spanIdFilters } = buildScene();

      spanIdFilters.onChange({ value: 'span-a', label: 'span-a' });

      expect(scene.state.$variables!.getByName('spanSelector')!.getValue()).toBe('span-a');
      expect(reportInteraction).toHaveBeenCalledWith('g_pyroscope_app_span_id_filter_changed', {
        source: 'dropdown',
      });
    });

    it('publishes a removal when the filter is cleared', () => {
      const { scene, spanIdFilters } = buildScene({ span: 'span-a' });
      const published: string[] = [];
      scene.subscribeToEvent(RemoveSpanSelector, () => published.push('span'));

      spanIdFilters.onChange(null);

      expect(published).toEqual(['span']);
    });
  });

  describe('visibility', () => {
    it('hides when there is nothing to pick and nothing selected', () => {
      const { spanIdFilters } = buildScene();

      render(<SceneSpanIdFilter.Component model={spanIdFilters} />);

      expect(screen.queryByTestId('span-id-filter')).not.toBeInTheDocument();
    });

    it('stays hidden while the first options fetch is still loading', () => {
      const { spanIdFilters } = buildScene();
      spanIdFilters.setState({ isLoading: true });

      render(<SceneSpanIdFilter.Component model={spanIdFilters} />);

      expect(screen.queryByTestId('span-id-filter')).not.toBeInTheDocument();
    });

    it('renders when a span is selected, so an active filter stays clearable', () => {
      const { spanIdFilters } = buildScene({ span: 'span-a' });

      render(<SceneSpanIdFilter.Component model={spanIdFilters} />);

      expect(screen.getByTestId('span-id-filter')).toHaveValue('span-a');
    });

    it('renders when there are options to pick from', () => {
      const { spanIdFilters } = buildScene();
      spanIdFilters.setState({ options: [{ value: 'span-a', label: 'span-a' }] });

      render(<SceneSpanIdFilter.Component model={spanIdFilters} />);

      expect(screen.getByTestId('span-id-filter')).toBeInTheDocument();
    });
  });
});
