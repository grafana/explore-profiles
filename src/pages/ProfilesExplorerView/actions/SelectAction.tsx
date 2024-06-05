import { css } from '@emotion/css';
import { SceneComponentProps, sceneGraph, SceneObjectBase, SceneObjectState } from '@grafana/scenes';
import { Button, IconButton, IconName, useStyles2 } from '@grafana/ui';
import React from 'react';

import { EventAddToFilters, EventAddToFiltersPayload } from '../events/EventAddToFilters';
import { EventExplore, EventExplorePayload } from '../events/EventExplore';
import { EventSelectLabel, EventSelectLabelPayload } from '../events/EventSelectLabel';
import { EventShowPieChart, EventShowPieChartPayload } from '../events/EventShowPieChart';
import { EventViewDetails, EventViewDetailsPayload } from '../events/EventViewDetails';
import { GridItemData } from '../types/GridItemData';

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
  [EventShowPieChart, { label: 'Show values distribution', icon: 'percentage' }],
]);

interface SelectActionState extends SceneObjectState {
  EventClass: EventContructor;
  item: GridItemData;
  label: string;
  icon?: IconName;
}

export class SelectAction extends SceneObjectBase<SelectActionState> {
  constructor({ EventClass, item }: { EventClass: EventContructor; item: SelectActionState['item'] }) {
    const lookup = Events.get(EventClass);
    if (!lookup) {
      throw new TypeError(`Unknown event class "${EventClass}"!`);
    }

    const { label, icon } = lookup;

    super({ EventClass, item, label, icon });
  }

  public onClick = () => {
    this.publishEvent(this.buildEvent(), true);
  };

  buildEvent() {
    const { EventClass, item } = this.state;
    const { queryRunnerParams } = item;

    return new EventClass({
      item: {
        ...item,
        queryRunnerParams: {
          ...queryRunnerParams,
          serviceName:
            queryRunnerParams.serviceName || (sceneGraph.lookupVariable('serviceName', this)?.getValue() as string),
          profileMetricId:
            queryRunnerParams.profileMetricId ||
            (sceneGraph.lookupVariable('profileMetricId', this)?.getValue() as string),
        },
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
        aria-label={label}
        tooltip={label}
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
