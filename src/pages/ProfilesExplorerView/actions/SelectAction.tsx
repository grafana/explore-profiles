import { css } from '@emotion/css';
import { SceneComponentProps, sceneGraph, SceneObjectBase, SceneObjectState } from '@grafana/scenes';
import { Button, useStyles2 } from '@grafana/ui';
import React from 'react';

import { EventExplore, EventExplorePayload } from '../events/EventExplore';
import { EventSelect, EventSelectPayload } from '../events/EventSelect';
import { ExplorationType, ExplorationTypeVariable } from '../variables/ExplorationTypeVariable';

type EventContructor =
  | (new (payload: EventExplorePayload) => EventExplore)
  | (new (payload: EventSelectPayload) => EventSelect);

const Events = new Map<string, EventContructor>([
  ['EventExplore', EventExplore],
  ['EventSelect', EventSelect],
]);

interface SelectActionState extends SceneObjectState {
  label: string;
  params: Record<string, string>;
  eventClass: string;
}

export class SelectAction extends SceneObjectBase<SelectActionState> {
  public onClick = () => {
    this.publishEvent(this.buildEvent(), true);
  };

  buildEvent() {
    const { params, eventClass } = this.state;

    const fullParams = {
      ...params,
      serviceName: params.serviceName || (sceneGraph.getVariables(this).getByName('serviceName')?.getValue() as string),
      profileMetricId:
        params.profileMetricId || (sceneGraph.getVariables(this).getByName('profileMetricId')?.getValue() as string),
    };

    const EventClass = Events.get(eventClass);
    if (!EventClass) {
      throw new TypeError(`Unknown event class "${eventClass}"!`);
    }

    const explorationType = (
      sceneGraph.findObject(this, (o) => o instanceof ExplorationTypeVariable) as ExplorationTypeVariable
    )?.getValue() as ExplorationType;

    console.log('*** SelectAction', {
      explorationType,
      params: fullParams,
    });

    return new EventClass({
      explorationType,
      params: fullParams,
    });
  }

  public static Component = ({ model }: SceneComponentProps<SelectAction>) => {
    const styles = useStyles2(getStyles);
    const { label } = model.useState();

    return (
      <Button className={styles.selectButton} variant="primary" size="sm" fill="text" onClick={model.onClick}>
        {label}
      </Button>
    );
  };
}

const getStyles = () => ({
  selectButton: css`
    margin: 0;
    padding: 0;
  `,
});
