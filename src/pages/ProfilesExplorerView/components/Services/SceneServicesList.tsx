import { css } from '@emotion/css';
import { DashboardCursorSync } from '@grafana/data';
import {
  behaviors,
  EmbeddedSceneState,
  PanelBuilders,
  SceneComponentProps,
  SceneCSSGridItem,
  SceneCSSGridLayout,
  SceneObjectBase,
} from '@grafana/scenes';
import { useStyles2 } from '@grafana/ui';
import React from 'react';

import { FavAction } from '../actions/FavAction';
import { getColorByIndex } from '../helpers/getColorByIndex';
import { ServiceOptions } from '../helpers/getServiceOptions';
import { SelectServiceAction } from './actions/SelectServiceAction';
import { getServiceQueryRunner } from './data/getServiceQueryRunner';

const GRID_TEMPLATE_COLUMNS = 'repeat(auto-fit, minmax(400px, 1fr))';
const GRID_AUTO_ROWS = '240px';

interface SceneServicesListState extends EmbeddedSceneState {
  services: ServiceOptions;
  body: SceneCSSGridLayout;
}

export class SceneServicesList extends SceneObjectBase<SceneServicesListState> {
  constructor({ services }: { services: ServiceOptions }) {
    super({
      services,
      body: new SceneCSSGridLayout({
        templateColumns: GRID_TEMPLATE_COLUMNS,
        autoRows: GRID_AUTO_ROWS,
        isLazy: true,
        $behaviors: [new behaviors.CursorSync({ key: 'metricCrosshairSync', sync: DashboardCursorSync.Crosshair })],
        children: [],
      }),
    });

    this.update({ services });
  }

  update({ services }: { services: ServiceOptions }) {
    this.state.body.setState({
      children: this.buildGridItems(services),
    });
  }

  buildGridItems(services: ServiceOptions) {
    return services.map((service, i) => {
      const data = getServiceQueryRunner({ serviceName: service.value });

      return new SceneCSSGridItem({
        body: PanelBuilders.timeseries()
          .setTitle(service.value)
          .setOption('legend', { showLegend: false }) // hide profile metric ("cpu", etc.)
          .setData(data)
          .setColor({ mode: 'fixed', fixedColor: getColorByIndex(i) })
          .setCustomFieldConfig('fillOpacity', 9)
          .setHeaderActions([
            new SelectServiceAction({ serviceName: service.value }),
            new FavAction({
              serviceName: service.value,
              labelId: '',
            }),
          ])
          .build(),
      });
    });
  }

  static Component = ({ model }: SceneComponentProps<SceneServicesList>) => {
    const styles = useStyles2(getStyles);
    const { body } = model.useState();

    return (
      <div className={styles.body}>
        <body.Component model={body} />
      </div>
    );
  };
}

const getStyles = () => ({
  body: css`
    display: flex;
    flex-direction: column;
    overflow-y: scroll; // does not work :/
  `,
});
