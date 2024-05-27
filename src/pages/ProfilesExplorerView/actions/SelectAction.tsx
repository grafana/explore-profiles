import { css } from '@emotion/css';
import { SceneComponentProps, sceneGraph, SceneObjectBase, SceneObjectState } from '@grafana/scenes';
import { Button, useStyles2 } from '@grafana/ui';
import React from 'react';

import { EventExplore, EventExplorePayload } from '../events/EventExplore';
import { EventViewDetails, EventViewDetailsPayload } from '../events/EventViewDetails';

type EventContructor =
  | (new (payload: EventExplorePayload) => EventExplore)
  | (new (payload: EventViewDetailsPayload) => EventViewDetails);

const Events = new Map<string, { EventClass: EventContructor; label: string }>([
  ['EventExplore', { EventClass: EventExplore, label: 'Explore' }],
  ['EventViewDetails', { EventClass: EventViewDetails, label: 'Details' }],
]);

interface SelectActionState extends SceneObjectState {
  EventClass: EventContructor;
  params: Record<string, string>;
  label: string;
}

export class SelectAction extends SceneObjectBase<SelectActionState> {
  constructor({
    eventClass,
    params,
  }: {
    eventClass: 'EventExplore' | 'EventViewDetails';
    params: SelectActionState['params'];
  }) {
    const lookup = Events.get(eventClass);
    if (!lookup) {
      throw new TypeError(`Unknown event class "${eventClass}"!`);
    }

    const { EventClass, label } = lookup;

    super({ EventClass, params, label });
  }

  public onClick = () => {
    this.publishEvent(this.buildEvent(), true);
  };

  buildEvent() {
    const { EventClass, params } = this.state;

    return new EventClass({
      params: {
        ...params,
        serviceName:
          params.serviceName || (sceneGraph.getVariables(this).getByName('serviceName')?.getValue() as string),
        profileMetricId:
          params.profileMetricId || (sceneGraph.getVariables(this).getByName('profileMetricId')?.getValue() as string),
      },
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
