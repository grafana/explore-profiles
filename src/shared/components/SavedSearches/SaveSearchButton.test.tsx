import { usePluginComponent } from '@grafana/runtime';
import { sceneGraph } from '@grafana/scenes';
import { fireEvent, render, screen } from '@testing-library/react';
import React from 'react';

import { SaveSearchButton } from './SaveSearchButton';
import { asSceneObject, getSaveSearchMock, getUtilsMock } from './testHelpers';

jest.mock('react-inlinesvg', () => {
  const React = require('react');
  return {
    __esModule: true,
    default: () => React.createElement('svg', {}),
  };
});
jest.mock('./saveSearch', () => ({
  useSavedSearches: jest.fn(),
  useCheckForExistingSearch: jest.fn(),
  isQueryLibrarySupported: jest.fn(),
}));
jest.mock('./utils', () => ({
  getDatasourceVariable: jest.fn(),
  getFiltersVariable: jest.fn(),
  getProfilesExplorerScene: jest.fn(),
  filtersToLabelSelectorExpression: jest.fn(),
}));
jest.mock('../../../pages/ProfilesExplorerView/domain/variables/FiltersVariable/filters-ops');
jest.mock('@grafana/runtime');

const saveSearch = getSaveSearchMock();
const utils = getUtilsMock();

describe('SaveSearchButton', () => {
  const mockSceneRef = asSceneObject({});

  beforeEach(() => {
    jest.clearAllMocks();
    utils.getDatasourceVariable.mockReturnValue({
      getValue: () => 'test-datasource-uid',
      state: { text: 'test-datasource-uid' },
    });
    const mockProfilesExplorer = {
      state: { isEmbedded: false },
      forEachChild: jest.fn(),
    };
    utils.getProfilesExplorerScene.mockReturnValue(mockProfilesExplorer);
    const mockFilters = [{ key: 'job', operator: '=' as const, value: 'test' }];
    utils.getFiltersVariable.mockReturnValue({
      state: { filters: mockFilters },
      useState: () => ({ filters: mockFilters }),
    });
    utils.filtersToLabelSelectorExpression.mockReturnValue('{job="test"}');
    jest
      .spyOn(sceneGraph, 'findByKeyAndType')
      .mockReturnValue(asSceneObject({ useState: () => ({ value: 'profile-metric-id' }) }));
    jest.spyOn(sceneGraph, 'getAncestor').mockReturnValue(asSceneObject({ state: { isEmbedded: false } }));
    saveSearch.useSavedSearches.mockReturnValue({
      saveSearch: jest.fn(),
      isLoading: false,
      searches: [],
      deleteSearch: jest.fn(),
    });
    jest.mocked(usePluginComponent).mockReturnValue({ component: undefined, isLoading: false });
    saveSearch.isQueryLibrarySupported.mockReturnValue(false);
  });

  test('Opens the modal when the button is clicked', () => {
    render(<SaveSearchButton sceneRef={mockSceneRef} />);

    expect(screen.queryByText('Save current search')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Save/i }));

    expect(screen.getByText('Save current search')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Cancel/i }));

    expect(screen.queryByText('Save current search')).not.toBeInTheDocument();
  });

  test('Returns null when the scene is embedded', () => {
    // SaveSearchButton returns null when query library is supported but no exposed component is available
    saveSearch.isQueryLibrarySupported.mockReturnValue(true);
    jest.mocked(usePluginComponent).mockReturnValue({ component: undefined, isLoading: false });

    const { container } = render(<SaveSearchButton sceneRef={mockSceneRef} />);
    expect(container.firstChild).toBeNull();
  });

  test('Returns null when there are no filters', () => {
    utils.getFiltersVariable.mockReturnValue({
      state: { filters: [] },
      useState: () => ({ filters: [] }),
    });

    const { container } = render(<SaveSearchButton sceneRef={mockSceneRef} />);
    expect(container.firstChild).toBeNull();
  });

  test('Uses the exposed component if available', () => {
    const component = () => <div>Exposed component</div>;
    saveSearch.isQueryLibrarySupported.mockReturnValue(true);
    jest.mocked(usePluginComponent).mockReturnValue({ component, isLoading: false });

    render(<SaveSearchButton sceneRef={mockSceneRef} />);

    expect(screen.getByText('Exposed component')).toBeInTheDocument();
  });
});
