import { css } from '@emotion/css';
import { SceneComponentProps, sceneGraph, SceneObjectBase, SceneObjectState } from '@grafana/scenes';
import { Button, useStyles2 } from '@grafana/ui';
import React from 'react';

import { EventAddToFilters, EventAddToFiltersPayload } from '../events/EventAddToFilters';
import { EventExplore, EventExplorePayload } from '../events/EventExplore';
import { EventSelectLabel, EventSelectLabelPayload } from '../events/EventSelectLabel';
import { EventViewDetails, EventViewDetailsPayload } from '../events/EventViewDetails';

type EventContructor =
  | (new (payload: EventExplorePayload) => EventExplore)
  | (new (payload: EventViewDetailsPayload) => EventViewDetails)
  | (new (payload: EventSelectLabelPayload) => EventSelectLabel)
  | (new (payload: EventAddToFiltersPayload) => EventAddToFilters);

const Events = new Map<string, { EventClass: EventContructor; label: string }>([
  ['EventExplore', { EventClass: EventExplore, label: 'Explore' }],
  ['EventViewDetails', { EventClass: EventViewDetails, label: 'Details' }],
  ['EventSelectLabel', { EventClass: EventSelectLabel, label: 'Select' }],
  ['EventAddToFilters', { EventClass: EventAddToFilters, label: 'Add to filters' }],
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
    eventClass: 'EventExplore' | 'EventViewDetails' | 'EventSelectLabel' | 'EventAddToFilters';
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
        serviceName: params.serviceName || (sceneGraph.lookupVariable('serviceName', this)?.getValue() as string),
        profileMetricId:
          params.profileMetricId || (sceneGraph.lookupVariable('profileMetricId', this)?.getValue() as string),
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
