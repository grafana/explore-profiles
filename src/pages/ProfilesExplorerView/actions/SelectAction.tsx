import { css } from '@emotion/css';
import { SceneComponentProps, sceneGraph, SceneObjectBase, SceneObjectState } from '@grafana/scenes';
import { Button, IconName, useStyles2 } from '@grafana/ui';
import React from 'react';

import { EventAddLabelToFilters, EventAddLabelToFiltersPayload } from '../events/EventAddLabelToFilters';
import { EventSelectLabel, EventSelectLabelPayload } from '../events/EventSelectLabel';
import {
  EventViewLabelValuesDistribution,
  EventViewLabelValuesDistributionPayload,
} from '../events/EventViewLabelValuesDistribution';
import { EventViewServiceFlameGraph, EventViewServiceFlameGraphPayload } from '../events/EventViewServiceFlameGraph';
import { EventViewServiceLabels, EventViewServiceLabelsPayload } from '../events/EventViewServiceLabels';
import { EventViewServiceProfiles, EventViewServiceProfilesPayload } from '../events/EventViewServiceProfiles';
import { GridItemData } from '../types/GridItemData';

type EventContructor =
  | (new (payload: EventAddLabelToFiltersPayload) => EventAddLabelToFilters)
  | (new (payload: EventSelectLabelPayload) => EventSelectLabel)
  | (new (payload: EventViewLabelValuesDistributionPayload) => EventViewLabelValuesDistribution)
  | (new (payload: EventViewServiceFlameGraphPayload) => EventViewServiceFlameGraph)
  | (new (payload: EventViewServiceLabelsPayload) => EventViewServiceLabels)
  | (new (payload: EventViewServiceProfilesPayload) => EventViewServiceProfiles);

const Events = new Map<EventContructor, { label?: string; icon?: IconName; tooltip?: string }>([
  [EventAddLabelToFilters, { label: 'Add to filters' }],
  [EventSelectLabel, { label: 'Select', tooltip: '' }],
  [EventViewLabelValuesDistribution, { label: '', icon: 'percentage', tooltip: 'Show all values distribution' }],
  [EventViewServiceFlameGraph, { label: 'Flame graph', tooltip: '' }],
  [EventViewServiceLabels, { label: 'Labels', tooltip: '' }],
  [EventViewServiceProfiles, { label: 'Profiles', tooltip: '' }],
]);

interface SelectActionState extends SceneObjectState {
  EventClass: EventContructor;
  item: GridItemData;
  label?: string;
  icon?: IconName;
  tooltip?: string;
}

export class SelectAction extends SceneObjectBase<SelectActionState> {
  constructor({ EventClass, item }: { EventClass: EventContructor; item: SelectActionState['item'] }) {
    const lookup = Events.get(EventClass);
    if (!lookup) {
      throw new TypeError(`Unknown event class "${EventClass}"!`);
    }

    const { label, icon, tooltip } = lookup;

    super({ EventClass, item, label, icon, tooltip });
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
    const { label, icon, tooltip } = model.useState();

    return (
      <Button
        className={styles.selectButton}
        variant="primary"
        size="sm"
        fill="text"
        onClick={model.onClick}
        icon={icon}
        tooltip={tooltip}
        tooltipPlacement="top"
      >
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
