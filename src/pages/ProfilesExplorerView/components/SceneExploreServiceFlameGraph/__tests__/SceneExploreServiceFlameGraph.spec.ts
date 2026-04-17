import { AdHocVariableFilter } from '@grafana/data';
import { sceneGraph } from '@grafana/scenes';

import { SceneExploreServiceFlameGraph } from '../SceneExploreServiceFlameGraph';

// Mock heavy transitive dependencies that pull in SVGs/CSS
jest.mock('../../SceneByVariableRepeaterGrid/SceneByVariableRepeaterGrid', () => ({}));
jest.mock('../../SceneMainServiceTimeseries', () => ({
  SceneMainServiceTimeseries: class {
    static MIN_HEIGHT = 200;
    constructor() {}
  },
}));
jest.mock('../SceneFlameGraph', () => ({
  SceneFlameGraph: class {
    constructor() {}
  },
}));
jest.mock('../../../domain/actions/SelectAction', () => ({
  SelectAction: class {
    constructor() {}
  },
}));
jest.mock('../../../domain/actions/FavAction', () => ({
  FavAction: class {
    constructor() {}
  },
}));
jest.mock('../components/ResolutionBoostExtensionPoint', () => ({
  ResolutionBoostExtensionPoint: () => null,
}));
jest.mock('../../../domain/variables/FiltersVariable/AllServicesFilterVariable', () => ({
  AllServicesFilterVariable: class {},
}));
jest.mock('../../../domain/variables/FiltersVariable/FiltersVariable', () => ({
  FiltersVariable: class {},
}));
jest.mock('../../../domain/variables/ProfileMetricVariable', () => ({
  ProfileMetricVariable: class {
    static QUERY_DEFAULT = 'default';
    static QUERY_SERVICE_NAME_DEPENDENT = 'service-name-dependent';
  },
}));
jest.mock('../../../domain/variables/ServiceNameVariable/ServiceNameVariable', () => ({
  ServiceNameVariable: class {},
}));
jest.mock('../../../domain/variables/ProfileIdSelectorVariable', () => ({
  ProfileIdSelectorVariable: class {},
}));

function makeFilter(key: string, operator: string, value: string): AdHocVariableFilter {
  return { key, operator, value };
}

function createMockFiltersVariable(initialFilters: AdHocVariableFilter[] = []) {
  return {
    state: { filters: [...initialFilters] },
    setState(update: { filters: AdHocVariableFilter[] }) {
      this.state = { ...this.state, ...update };
    },
    updateFilters(filters: AdHocVariableFilter[]) {
      this.state.filters = filters;
    },
  };
}

function createMockProfileMetricVariable() {
  return {
    state: { query: '' },
    setState(update: any) {
      this.state = { ...this.state, ...update };
    },
    update: jest.fn(),
  };
}

describe('SceneExploreServiceFlameGraph', () => {
  describe('onActivate / deactivate filter cleanup', () => {
    let scene: SceneExploreServiceFlameGraph;
    let filtersVariable: ReturnType<typeof createMockFiltersVariable>;
    let allServicesFiltersVariable: ReturnType<typeof createMockFiltersVariable>;
    let profileMetricVariable: ReturnType<typeof createMockProfileMetricVariable>;

    beforeEach(() => {
      filtersVariable = createMockFiltersVariable();
      allServicesFiltersVariable = createMockFiltersVariable();
      profileMetricVariable = createMockProfileMetricVariable();

      jest.spyOn(sceneGraph, 'findByKeyAndType').mockImplementation((_obj: any, key: string) => {
        const mocks: Record<string, any> = {
          filtersAllServices: allServicesFiltersVariable,
          filters: filtersVariable,
          profileMetricId: profileMetricVariable,
          serviceName: { changeValueTo: jest.fn() },
          profileIdSelector: { changeValueTo: jest.fn() },
        };
        return mocks[key];
      });

      scene = new SceneExploreServiceFlameGraph({});
    });

    it('copies allServicesFilters into filtersVariable on activate', () => {
      const allServicesFilter = makeFilter('region', '=', 'us-east');
      allServicesFiltersVariable.state.filters = [allServicesFilter];

      scene.onActivate();

      expect(filtersVariable.state.filters).toContainEqual(allServicesFilter);
    });

    it('merges allServicesFilters with existing filters on activate', () => {
      const existingFilter = makeFilter('env', '=', 'prod');
      const allServicesFilter = makeFilter('region', '=', 'us-east');
      filtersVariable.state.filters = [existingFilter];
      allServicesFiltersVariable.state.filters = [allServicesFilter];

      scene.onActivate();

      expect(filtersVariable.state.filters).toContainEqual(existingFilter);
      expect(filtersVariable.state.filters).toContainEqual(allServicesFilter);
    });

    it('does not modify filtersVariable when allServicesFilters is empty', () => {
      const existingFilter = makeFilter('env', '=', 'prod');
      filtersVariable.state.filters = [existingFilter];
      allServicesFiltersVariable.state.filters = [];

      scene.onActivate();

      expect(filtersVariable.state.filters).toEqual([existingFilter]);
    });

    it('removes allServicesFilters from filtersVariable on deactivate', () => {
      const userFilter = makeFilter('env', '=', 'prod');
      const allServicesFilter = makeFilter('region', '=', 'us-east');
      allServicesFiltersVariable.state.filters = [allServicesFilter];
      filtersVariable.state.filters = [userFilter];

      const deactivate = scene.onActivate()!;

      // filtersVariable now has both
      expect(filtersVariable.state.filters).toContainEqual(allServicesFilter);
      expect(filtersVariable.state.filters).toContainEqual(userFilter);

      deactivate();

      expect(filtersVariable.state.filters).toEqual([userFilter]);
    });

    it('preserves user-added filters on deactivate', () => {
      const allServicesFilter = makeFilter('region', '=', 'us-east');
      const userFilter1 = makeFilter('env', '=', 'prod');
      const userFilter2 = makeFilter('team', '=', 'backend');
      allServicesFiltersVariable.state.filters = [allServicesFilter];

      const deactivate = scene.onActivate()!;

      // Simulate user adding filters while the scene is active
      filtersVariable.state.filters = [allServicesFilter, userFilter1, userFilter2];

      deactivate();

      expect(filtersVariable.state.filters).toContainEqual(userFilter1);
      expect(filtersVariable.state.filters).toContainEqual(userFilter2);
      expect(filtersVariable.state.filters).not.toContainEqual(allServicesFilter);
    });

    it('removes all allServicesFilters when there are multiple', () => {
      const allServicesFilter1 = makeFilter('region', '=', 'us-east');
      const allServicesFilter2 = makeFilter('cluster', '=', 'prod-1');
      const userFilter = makeFilter('env', '=', 'prod');
      allServicesFiltersVariable.state.filters = [allServicesFilter1, allServicesFilter2];
      filtersVariable.state.filters = [userFilter];

      const deactivate = scene.onActivate()!;

      expect(filtersVariable.state.filters).toHaveLength(3);

      deactivate();

      expect(filtersVariable.state.filters).toEqual([userFilter]);
    });

    it('results in empty filters when all filters came from allServicesFilters', () => {
      const allServicesFilter = makeFilter('region', '=', 'us-east');
      allServicesFiltersVariable.state.filters = [allServicesFilter];

      const deactivate = scene.onActivate()!;

      deactivate();

      expect(filtersVariable.state.filters).toEqual([]);
    });
  });
});
