import { usePluginComponent } from '@grafana/runtime';
import { sceneGraph, SceneTimeRange } from '@grafana/scenes';
import { DataQuery } from '@grafana/schema';
import { fireEvent, render, screen } from '@testing-library/react';
import React from 'react';

import { LoadSearchScene } from './LoadSearchScene';
import { asSceneObject, getSaveSearchMock, getUtilsMock } from './testHelpers';

jest.mock('react-inlinesvg', () => {
  const React = require('react');
  return {
    __esModule: true,
    default: () => React.createElement('svg', {}),
  };
});
jest.mock('@grafana/runtime', () => ({
  ...jest.requireActual('@grafana/runtime'),
  usePluginComponent: jest.fn(),
}));
jest.mock('./saveSearch', () => ({
  useSavedSearches: jest.fn(),
  applySavedSearchToScene: jest.fn(),
  useHasSavedSearches: jest.fn(),
  isQueryLibrarySupported: jest.fn(),
}));
jest.mock('./utils', () => ({
  getDatasourceVariable: jest.fn(),
  getFiltersVariable: jest.fn(),
  getProfilesExplorerScene: jest.fn(),
}));

const saveSearch = getSaveSearchMock();
const utils = getUtilsMock();

function FakeExposedComponent({ onSelectQuery }: { onSelectQuery(query: DataQuery): void }) {
  return (
    <div>
      <button
        onClick={() => {
          onSelectQuery({
            refId: 'A',
            datasource: {
              type: 'grafana-pyroscope-datasource',
              uid: 'test-ds',
            },
            query: '{job="test1"}',
          } as DataQuery);
        }}
      >
        Select
      </button>
    </div>
  );
}

describe('LoadSearchScene', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    utils.getDatasourceVariable.mockReturnValue({
      getValue: () => 'test-datasource-uid',
      subscribeToState: jest.fn(),
      changeValueTo: jest.fn(),
      state: { text: 'test-datasource-uid' },
    });
    utils.getFiltersVariable.mockReturnValue({ setState: jest.fn() });
    utils.getProfilesExplorerScene.mockReturnValue({ state: { isEmbedded: false } });
    saveSearch.useSavedSearches.mockReturnValue({
      deleteSearch: jest.fn(),
      saveSearch: jest.fn(),
      searches: [],
      isLoading: false,
    });
    jest.spyOn(sceneGraph, 'getAncestor').mockReturnValue(asSceneObject({ state: { isEmbedded: false } }));
    jest.spyOn(sceneGraph, 'getTimeRange').mockReturnValue({
      state: { value: { from: 'now-1h', to: 'now', raw: { from: 'now-1h', to: 'now' } } },
    } as unknown as SceneTimeRange);
    jest.mocked(usePluginComponent).mockReturnValue({ component: undefined, isLoading: false });
    saveSearch.isQueryLibrarySupported.mockReturnValue(false);
  });

  test('Disables button when there are no saved searches', () => {
    saveSearch.useHasSavedSearches.mockReturnValue(false);

    const scene = new LoadSearchScene({ dsUid: 'test-datasource-uid', dsName: 'test-datasource-uid' });
    render(<scene.Component model={scene} />);

    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
  });

  test('Enables button when there are saved searches', () => {
    saveSearch.useHasSavedSearches.mockReturnValue(true);

    const scene = new LoadSearchScene({ dsUid: 'test-datasource-uid', dsName: 'test-datasource-uid' });
    render(<scene.Component model={scene} />);

    const button = screen.getByRole('button');
    expect(button).not.toBeDisabled();
  });

  test('Opens modal when button is clicked', () => {
    saveSearch.useHasSavedSearches.mockReturnValue(true);

    const scene = new LoadSearchScene({ dsUid: 'test-datasource-uid', dsName: 'test-datasource-uid' });
    render(<scene.Component model={scene} />);

    expect(screen.queryByText('Load a previously saved search')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button'));

    expect(screen.queryByText('Load a previously saved search')).toBeInTheDocument();

    fireEvent.click(screen.getByLabelText('Close'));

    expect(screen.queryByText('Load a previously saved search')).not.toBeInTheDocument();
  });

  test('Returns null when the scene is embedded', () => {
    // LoadSearchScene returns null when query library is supported but no exposed component is available
    saveSearch.isQueryLibrarySupported.mockReturnValue(true);
    jest.mocked(usePluginComponent).mockReturnValue({ component: undefined, isLoading: false });

    const scene = new LoadSearchScene({ dsUid: 'test-datasource-uid', dsName: 'test-datasource-uid' });
    const { container } = render(<scene.Component model={scene} />);

    expect(container.firstChild).toBeNull();
  });

  test('Uses the exposed component if available', () => {
    const component = () => <div>Exposed component</div>;
    saveSearch.isQueryLibrarySupported.mockReturnValue(true);
    jest.mocked(usePluginComponent).mockReturnValue({ component, isLoading: false });

    const scene = new LoadSearchScene({ dsUid: 'test-datasource-uid', dsName: 'test-datasource-uid' });
    render(<scene.Component model={scene} />);

    expect(screen.getByText('Exposed component')).toBeInTheDocument();
  });

  describe('Loading a search', () => {
    beforeEach(() => {
      saveSearch.isQueryLibrarySupported.mockReturnValue(true);
      // @ts-expect-error
      jest.mocked(usePluginComponent).mockReturnValue({ component: FakeExposedComponent, isLoading: false });
      saveSearch.useHasSavedSearches.mockReturnValue(true);
    });

    test('Applies filters when a query is selected from the exposed component', () => {
      const scene = new LoadSearchScene({ dsUid: 'test-datasource-uid', dsName: 'test-datasource-uid' });
      render(<scene.Component model={scene} />);

      fireEvent.click(screen.getByText('Select'));

      expect(saveSearch.applySavedSearchToScene).toHaveBeenCalledWith(scene, '{job="test1"}', 'test-ds');
    });
  });
});
