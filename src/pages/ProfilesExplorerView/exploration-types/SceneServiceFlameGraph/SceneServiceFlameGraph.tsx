import { css } from '@emotion/css';
import { GrafanaTheme2 } from '@grafana/data';
import { SceneComponentProps, SceneObjectBase, SceneObjectState } from '@grafana/scenes';
import { useStyles2 } from '@grafana/ui';
import React from 'react';

import { FavAction } from '../../actions/FavAction';
import { SelectAction } from '../../actions/SelectAction';
import { SceneMainServiceTimeseries } from '../../components/SceneMainServiceTimeseries';
import { EventViewServiceLabels } from '../../events/EventViewServiceLabels';
import { EventViewServiceProfiles } from '../../events/EventViewServiceProfiles';
import { SceneFlameGraph } from './SceneFlameGraph';

interface SceneServiceFlameGraphState extends SceneObjectState {
  mainTimeseries: SceneMainServiceTimeseries;
  body: SceneFlameGraph;
}

export class SceneServiceFlameGraph extends SceneObjectBase<SceneServiceFlameGraphState> {
  constructor() {
    super({
      key: 'explore-service-flame-graph',
      mainTimeseries: new SceneMainServiceTimeseries({
        headerActions: (item) => [
          new SelectAction({ EventClass: EventViewServiceProfiles, item }),
          new SelectAction({ EventClass: EventViewServiceLabels, item }),
          new FavAction({ item }),
        ],
      }),
      body: new SceneFlameGraph(),
    });
  }

  static Component({ model }: SceneComponentProps<SceneServiceFlameGraph>) {
    const styles = useStyles2(getStyles); // eslint-disable-line react-hooks/rules-of-hooks
    const { mainTimeseries, body } = model.useState();

    // we use CSS here and Scenes Flex layout because we encountered a problem where the Flamegraph would not respect each panel width,
    // resulting in a cropped flame graph when opening the side panel
    return (
      <div className={styles.flex}>
        <div className={styles.mainTimeseries}>
          <mainTimeseries.Component model={mainTimeseries} />
        </div>
        <body.Component model={body} />
      </div>
    );
  }
}

const getStyles = (theme: GrafanaTheme2) => ({
  flex: css`
    display: flex;
    flex-direction: column;
    width: 100%;
    gap: ${theme.spacing(1)};
  `,
  mainTimeseries: css`
    height: ${SceneMainServiceTimeseries.MIN_HEIGHT}px;
  `,
});
