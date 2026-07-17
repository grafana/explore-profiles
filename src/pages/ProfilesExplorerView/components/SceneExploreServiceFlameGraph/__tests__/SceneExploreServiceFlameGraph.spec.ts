import { SceneExploreServiceFlameGraph } from '../SceneExploreServiceFlameGraph';

jest.mock('@shared/infrastructure/featureFlags/featureFlags', () => ({
  getProfilesHeatmapFromOpenFeature: () => true,
}));

jest.mock('../../../domain/variables/FiltersVariable/FiltersVariable', () => ({
  FiltersVariable: class FiltersVariable {},
}));

jest.mock('../SceneFlameGraph', () => {
  const { SceneObjectBase } = jest.requireActual('@grafana/scenes');

  return {
    SceneFlameGraph: class SceneFlameGraph extends SceneObjectBase {
      constructor() {
        super({});
      }
    },
  };
});

jest.mock('../../SceneMainServiceTimeseries', () => {
  const { SceneObjectBase } = jest.requireActual('@grafana/scenes');

  return {
    SceneMainServiceTimeseries: class SceneMainServiceTimeseries extends SceneObjectBase {
      static MIN_HEIGHT = 0;

      constructor() {
        super({});
      }
    },
  };
});

describe('SceneExploreServiceFlameGraph', () => {
  it('clears the selected span when switching from span heatmap to time series', () => {
    const scene = new SceneExploreServiceFlameGraph({});
    const clearSpanProfileSelection = jest.spyOn(scene, 'clearSpanProfileSelection').mockImplementation();
    jest.spyOn(scene, 'probeSpanAvailability').mockImplementation();

    scene.setState({ showSpanHeatmap: true });
    scene.closeSpanHeatmapMode();

    expect(clearSpanProfileSelection).toHaveBeenCalledTimes(1);
    expect(scene.state.showSpanHeatmap).toBe(false);
  });

  it('switches from span heatmap to time series when the service changes', () => {
    const onShowSpanHeatmapChange = jest.fn();
    const scene = new SceneExploreServiceFlameGraph({ onShowSpanHeatmapChange });
    const clearSpanProfileSelection = jest.spyOn(scene, 'clearSpanProfileSelection').mockImplementation();
    const probeSpanAvailability = jest.spyOn(scene, 'probeSpanAvailability').mockImplementation();

    scene.setState({ showSpanHeatmap: true });
    scene.onServiceNameChange();

    expect(clearSpanProfileSelection).toHaveBeenCalledTimes(1);
    expect(scene.state.showSpanHeatmap).toBe(false);
    expect(scene.state.spanToggleAction.state.showSpanHeatmap).toBe(false);
    expect(onShowSpanHeatmapChange).toHaveBeenCalledWith(false);
    expect(probeSpanAvailability).toHaveBeenCalledTimes(1);
  });

  it('refreshes the open heatmap when the Pyroscope datasource changes', () => {
    const scene = new SceneExploreServiceFlameGraph({});
    const clearSpanProfileSelection = jest.spyOn(scene, 'clearSpanProfileSelection').mockImplementation();
    const fetchHeatmapData = jest.fn();

    scene.setState({
      showSpanHeatmap: true,
      spanHeatmap: { fetchHeatmapData } as any,
    });
    scene.onDataSourceChange();

    expect(clearSpanProfileSelection).toHaveBeenCalledTimes(1);
    expect(fetchHeatmapData).toHaveBeenCalledTimes(1);
  });

  it('opens span heatmap from URL state without recreating the scene', () => {
    const scene = new SceneExploreServiceFlameGraph({});
    const probeSpanAvailability = jest.spyOn(scene, 'probeSpanAvailability').mockImplementation();

    scene.syncSpanHeatmapFromUrl(true);

    expect(probeSpanAvailability).toHaveBeenCalledWith(true);
  });

  it('closes an open span heatmap from URL state', () => {
    const scene = new SceneExploreServiceFlameGraph({});
    const closeSpanHeatmapMode = jest.spyOn(scene, 'closeSpanHeatmapMode').mockImplementation();
    scene.setState({ showSpanHeatmap: true });

    scene.syncSpanHeatmapFromUrl(false);

    expect(closeSpanHeatmapMode).toHaveBeenCalledTimes(1);
  });
});
