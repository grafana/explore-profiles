import { css } from '@emotion/css';
import { SceneComponentProps, sceneGraph, SceneObjectBase, SceneObjectState } from '@grafana/scenes';
import { Button, IconButton, IconName, useStyles2 } from '@grafana/ui';
import React from 'react';

import { EventAddToFilters, EventAddToFiltersPayload } from '../events/EventAddToFilters';
import { EventExplore, EventExplorePayload } from '../events/EventExplore';
import { EventSelectLabel, EventSelectLabelPayload } from '../events/EventSelectLabel';
import { EventShowPieChart, EventShowPieChartPayload } from '../events/EventShowPieChart';
import { EventViewDetails, EventViewDetailsPayload } from '../events/EventViewDetails';

type EventContructor =
  | (new (payload: EventExplorePayload) => EventExplore)
  | (new (payload: EventViewDetailsPayload) => EventViewDetails)
  | (new (payload: EventSelectLabelPayload) => EventSelectLabel)
  | (new (payload: EventAddToFiltersPayload) => EventAddToFilters)
  | (new (payload: EventShowPieChartPayload) => EventShowPieChart);

const Events = new Map<EventContructor, { label: string; icon?: IconName }>([
  [EventExplore, { label: 'Explore' }],
  [EventViewDetails, { label: 'Details' }],
  [EventSelectLabel, { label: 'Select' }],
  [EventAddToFilters, { label: 'Add to filters' }],
  [EventShowPieChart, { label: 'Show pie chart', icon: 'percentage' }],
]);

interface SelectActionState extends SceneObjectState {
  EventClass: EventContructor;
  params: Record<string, string>;
  label: string;
  icon?: IconName;
}

export class SelectAction extends SceneObjectBase<SelectActionState> {
  constructor({ EventClass, params }: { EventClass: EventContructor; params: SelectActionState['params'] }) {
    const lookup = Events.get(EventClass);
    if (!lookup) {
      throw new TypeError(`Unknown event class "${EventClass}"!`);
    }

    const { label, icon } = lookup;

    super({ EventClass, params, label, icon });
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
    const { label, icon } = model.useState();

    return icon ? (
      <IconButton
        className={styles.selectButton}
        name="percentage"
        variant="secondary"
        size="sm"
        aria-label="Show pie chart"
        tooltip="Show pie chart"
        tooltipPlacement="top"
        onClick={model.onClick}
      />
    ) : (
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
