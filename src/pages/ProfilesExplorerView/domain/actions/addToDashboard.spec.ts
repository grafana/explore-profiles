import { sceneGraph, SceneQueryRunner, type VizPanel } from '@grafana/scenes';

import pluginJson from '../../../../plugin.json';
import {
  ADD_TO_DASHBOARD_COMPONENT_ID,
  EventOpenAddToDashboard,
  getPanelData,
  type PanelDataRequestPayload,
} from './addToDashboard';

describe('addToDashboard constants', () => {
  it('declares the add-to-dashboard exposed component in plugin.json dependencies', () => {
    expect(pluginJson.dependencies?.extensions?.exposedComponents).toContain(ADD_TO_DASHBOARD_COMPONENT_ID);
  });

  it('exposes the add-to-dashboard extension component id', () => {
    expect(ADD_TO_DASHBOARD_COMPONENT_ID).toBe('grafana/add-to-dashboard-form/v1');
  });
});

describe('EventOpenAddToDashboard', () => {
  it('uses a fixed event type', () => {
    expect(EventOpenAddToDashboard.type).toBe('open-add-to-dashboard');
  });

  it('carries panel data on the payload', () => {
    const panelData = {
      panel: { type: 'timeseries', title: 'T', targets: [] },
      range: { from: 'now-1h', to: 'now', raw: { from: 'now-1h', to: 'now' } },
    } as unknown as PanelDataRequestPayload;

    const evt = new EventOpenAddToDashboard({ panelData });

    expect(evt.payload.panelData).toBe(panelData);
  });
});

describe('getPanelData', () => {
  const mockRange = { from: 'now-6h', to: 'now', raw: { from: 'now-6h', to: 'now' } };

  const baseVizPanel = (): VizPanel =>
    ({
      state: {
        pluginId: 'timeseries',
        title: '{{interval}} — profiles',
        options: { legend: { displayMode: 'list' } },
        fieldConfig: { defaults: {}, overrides: [] },
      },
    } as unknown as VizPanel);

  beforeEach(() => {
    jest.spyOn(sceneGraph, 'getTimeRange').mockReturnValue({
      state: { value: mockRange },
    } as unknown as ReturnType<typeof sceneGraph.getTimeRange>);

    jest.spyOn(sceneGraph, 'interpolate').mockImplementation((_scene, value) => {
      if (typeof value !== 'string') {
        return String(value ?? '');
      }
      if (!value.includes('$') && !value.includes('{{')) {
        return value;
      }
      return `[interp:${value}]`;
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('returns time range from the scene graph', () => {
    const vizPanel = baseVizPanel();
    const dataRef = {};
    jest.spyOn(sceneGraph, 'getData').mockReturnValue(dataRef as ReturnType<typeof sceneGraph.getData>);
    jest.spyOn(sceneGraph, 'findObject').mockReturnValue(null);

    const { range } = getPanelData(vizPanel);

    expect(range).toBe(mockRange);
    expect(sceneGraph.getTimeRange).toHaveBeenCalledWith(vizPanel);
  });

  it('maps viz panel state onto the exported panel and clears targets when no query runner is found', () => {
    const vizPanel = baseVizPanel();
    jest.spyOn(sceneGraph, 'getData').mockReturnValue({} as ReturnType<typeof sceneGraph.getData>);
    jest.spyOn(sceneGraph, 'findObject').mockReturnValue(null);

    const { panel } = getPanelData(vizPanel);

    expect(panel.type).toBe('timeseries');
    expect(panel.title).toBe('[interp:{{interval}} — profiles]');
    expect(panel.targets).toEqual([]);
    expect(panel.options).toEqual(vizPanel.state.options);
    expect(panel.fieldConfig).toEqual(vizPanel.state.fieldConfig);
    expect(sceneGraph.findObject).toHaveBeenCalled();
  });

  it('includes optional description when present', () => {
    const vizPanel = {
      ...baseVizPanel(),
      state: {
        ...baseVizPanel().state,
        description: 'Panel help text',
      },
    } as unknown as VizPanel;

    jest.spyOn(sceneGraph, 'getData').mockReturnValue({} as ReturnType<typeof sceneGraph.getData>);
    jest.spyOn(sceneGraph, 'findObject').mockReturnValue(null);

    expect(getPanelData(vizPanel).panel.description).toBe('Panel help text');
  });

  it('interpolates string fields on metrics queries and interpolates datasource uid', () => {
    const vizPanel = baseVizPanel();
    const runner = new SceneQueryRunner({
      datasource: { uid: '${ds}', type: 'grafana-pyroscope-datasource' },
      queries: [
        {
          refId: 'A',
          queryType: 'metrics',
          profileTypeId: '$profileMetricId',
          labelSelector: '{service_name="$serviceName",$filters}',
          groupBy: ['job'],
        },
      ],
      maxDataPoints: 240,
    });

    const dataRef = {};
    jest.spyOn(sceneGraph, 'getData').mockReturnValue(dataRef as ReturnType<typeof sceneGraph.getData>);
    jest.spyOn(sceneGraph, 'findObject').mockImplementation((_root, predicate) => {
      expect(predicate(runner)).toBe(true);
      return runner;
    });

    const { panel } = getPanelData(vizPanel);

    expect(panel.targets).toEqual([
      {
        refId: 'A',
        queryType: 'metrics',
        profileTypeId: '[interp:$profileMetricId]',
        labelSelector: '[interp:{service_name="$serviceName",$filters}]',
        groupBy: ['job'],
      },
    ]);
    expect(panel.datasource).toEqual({
      uid: '[interp:${ds}]',
      type: 'grafana-pyroscope-datasource',
    });
    expect(panel.maxDataPoints).toBe(240);
  });

  it('leaves an empty query string unmodified', () => {
    const vizPanel = baseVizPanel();
    const runner = new SceneQueryRunner({
      datasource: { uid: 'fixed-uid', type: 'grafana-pyroscope-datasource' },
      queries: [{ refId: 'A', queryType: 'metrics', labelSelector: '' }],
    });

    jest.spyOn(sceneGraph, 'getData').mockReturnValue({} as ReturnType<typeof sceneGraph.getData>);
    jest.spyOn(sceneGraph, 'findObject').mockReturnValue(runner);

    const { panel } = getPanelData(vizPanel);

    expect(panel.targets?.[0]).toMatchObject({ labelSelector: '' });
    expect(sceneGraph.interpolate).not.toHaveBeenCalledWith(vizPanel, '');
  });

  it('does not pass datasource through interpolate when uid is missing', () => {
    const vizPanel = baseVizPanel();
    const runner = new SceneQueryRunner({
      datasource: { type: 'grafana-pyroscope-datasource' },
      queries: [{ refId: 'A', queryType: 'metrics', labelSelector: 'count()' }],
    });

    jest.spyOn(sceneGraph, 'getData').mockReturnValue({} as ReturnType<typeof sceneGraph.getData>);
    jest.spyOn(sceneGraph, 'findObject').mockReturnValue(runner);

    const { panel } = getPanelData(vizPanel);

    expect(panel.datasource).toEqual({ type: 'grafana-pyroscope-datasource' });
  });
});
