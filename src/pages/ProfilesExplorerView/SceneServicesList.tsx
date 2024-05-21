import { DashboardCursorSync } from '@grafana/data';
import {
  behaviors,
  EmbeddedSceneState,
  PanelBuilders,
  SceneComponentProps,
  SceneCSSGridItem,
  SceneCSSGridLayout,
  sceneGraph,
  SceneObjectBase,
} from '@grafana/scenes';
import { displayError } from '@shared/domain/displayStatus';
import { useFetchServices } from '@shared/infrastructure/services/useFetchServices';
import React, { useEffect } from 'react';

import { SelectServiceAction } from './actions/SelectServiceAction';
import { LayoutType } from './components/SceneLayoutSwitcher';
import { getServiceQueryRunner } from './data/getServiceQueryRunner';
import { getColorByIndex } from './helpers/getColorByIndex';

interface SceneProfilesExplorerState extends EmbeddedSceneState {
  services: string[];
  grid: SceneCSSGridLayout;
}

const GRID_TEMPLATE_COLUMNS = 'repeat(auto-fit, minmax(400px, 1fr))';
const GRID_TEMPLATE_ROWS = '1fr';
const GRID_AUTO_ROWS = '240px';

export class SceneServicesList extends SceneObjectBase<SceneProfilesExplorerState> {
  constructor({ layout }: { layout: LayoutType }) {
    const grid = new SceneCSSGridLayout({
      templateColumns: layout === LayoutType.GRID ? GRID_TEMPLATE_COLUMNS : GRID_TEMPLATE_ROWS,
      autoRows: GRID_AUTO_ROWS,
      isLazy: true,
      $behaviors: [
        new behaviors.CursorSync({
          key: 'metricCrosshairSync',
          sync: DashboardCursorSync.Crosshair,
        }),
      ],
      children: [],
    });

    super({
      services: [],
      grid,
      body: grid,
    });
  }

  onLayoutChange(newLayout: LayoutType) {
    this.state.grid.setState({
      templateColumns: newLayout === LayoutType.GRID ? GRID_TEMPLATE_COLUMNS : GRID_TEMPLATE_ROWS,
    });
  }

  onFilterChange(searchText: string) {
    const trimmedSearchText = searchText.trim();

    const filteredServices = trimmedSearchText
      ? this.state.services.filter((serviceName) => serviceName.includes(trimmedSearchText))
      : this.state.services;

    this.updateGridItems(filteredServices);
  }

  updateServices(services: string[]) {
    const sortedServices = services.sort((a, b) => a.localeCompare(b));

    this.setState({ services: sortedServices });
    this.updateGridItems(sortedServices);
  }

  updateGridItems(services: string[]) {
    const gridItems = services.map((serviceName, i) => {
      const data = getServiceQueryRunner({ serviceName });

      return new SceneCSSGridItem({
        body: PanelBuilders.timeseries()
          .setTitle(serviceName)
          .setOption('legend', { showLegend: false }) // hide profile metric ("cpu", etc.)
          .setData(data)
          .setColor({ mode: 'fixed', fixedColor: getColorByIndex(i) })
          .setCustomFieldConfig('fillOpacity', 9)
          .setHeaderActions([
            new SelectServiceAction({ serviceName }),
            // new FavAction({
            //   serviceName: service.value,
            //   labelId: '',
            // }),
          ])
          .build(),
      });
    });

    this.state.grid.setState({ children: gridItems });
  }

  static Component({ model }: SceneComponentProps<SceneServicesList>) {
    const { body } = model.useState();

    const timeRangeState = sceneGraph.getTimeRange(model).useState();
    // hack because SceneTimeRange updates the URL in UTC format (e.g. 2024-05-21T10:58:03.805Z)
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const { services, error: fetchServicesError } = useFetchServices({
      timeRange: {
        raw: {
          from: timeRangeState.value.from,
          to: timeRangeState.value.to,
        },
        from: timeRangeState.value.from,
        to: timeRangeState.value.to,
      },
    });

    if (fetchServicesError) {
      displayError(fetchServicesError, [
        'Error while fetching the services list! Sorry for the inconvenience. Please try reloading the page.',
        fetchServicesError.message,
      ]);
    }

    // eslint-disable-next-line react-hooks/rules-of-hooks
    useEffect(() => {
      model.updateServices(Array.from(services.keys()));
    }, [model, services]);

    return <body.Component model={body} />;
  }
}
