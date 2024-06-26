import { css } from '@emotion/css';
import { SceneComponentProps, sceneGraph, SceneObjectBase, SceneObjectState } from '@grafana/scenes';
import { Button, IconName, useStyles2 } from '@grafana/ui';
import { merge } from 'lodash';
import React from 'react';

import { GridItemData } from '../components/SceneByVariableRepeaterGrid/GridItemData';
import { EventAddLabelToFilters, EventAddLabelToFiltersPayload } from '../events/EventAddLabelToFilters';
import { EventExpandPanel, EventExpandPanelPayload } from '../events/EventExpandPanel';
import { EventSelectLabel, EventSelectLabelPayload } from '../events/EventSelectLabel';
import {
  EventViewLabelValuesDistribution,
  EventViewLabelValuesDistributionPayload,
} from '../events/EventViewLabelValuesDistribution';
import { EventViewServiceFlameGraph, EventViewServiceFlameGraphPayload } from '../events/EventViewServiceFlameGraph';
import { EventViewServiceLabels, EventViewServiceLabelsPayload } from '../events/EventViewServiceLabels';
import { EventViewServiceProfiles, EventViewServiceProfilesPayload } from '../events/EventViewServiceProfiles';
import { parseVariableValue } from '../variables/FiltersVariable/filters-ops';

type EventContructor =
  | (new (payload: EventAddLabelToFiltersPayload) => EventAddLabelToFilters)
  | (new (payload: EventExpandPanelPayload) => EventExpandPanel)
  | (new (payload: EventSelectLabelPayload) => EventSelectLabel)
  | (new (payload: EventViewLabelValuesDistributionPayload) => EventViewLabelValuesDistribution)
  | (new (payload: EventViewServiceFlameGraphPayload) => EventViewServiceFlameGraph)
  | (new (payload: EventViewServiceLabelsPayload) => EventViewServiceLabels)
  | (new (payload: EventViewServiceProfilesPayload) => EventViewServiceProfiles);

const Events = new Map<EventContructor, { label?: string; icon?: IconName; tooltip?: string }>([
  [EventAddLabelToFilters, Object.freeze({ label: 'Add to filters' })],
  [
    EventExpandPanel,
    Object.freeze({
      icon: 'expand-arrows',
      tooltip: 'Expand this panel to view all the timeseries for the current filters',
    }),
  ],
  [EventSelectLabel, Object.freeze({ label: 'Select' })],
  [
    EventViewLabelValuesDistribution,
    Object.freeze({ icon: 'list-ul', tooltip: 'View the distribution of all the values for the current filters' }),
  ],
  [EventViewServiceFlameGraph, Object.freeze({ label: 'Flame graph' })],
  [EventViewServiceLabels, Object.freeze({ label: 'Labels' })],
  [EventViewServiceProfiles, Object.freeze({ label: 'Profiles' })],
]);

interface SelectActionState extends SceneObjectState {
  EventClass: EventContructor;
  item: GridItemData;
  label?: string;
  icon?: IconName;
  tooltip?: string;
}

export class SelectAction extends SceneObjectBase<SelectActionState> {
  constructor({
    EventClass,
    item,
    icon,
    tooltip,
  }: {
    EventClass: EventContructor;
    item: SelectActionState['item'];
    icon?: SelectActionState['icon'];
    tooltip?: SelectActionState['tooltip'];
  }) {
    const lookup = Events.get(EventClass);
    if (!lookup) {
      throw new TypeError(`Unknown event class "${EventClass}"!`);
    }

    super({ EventClass, item, ...merge({}, lookup, { icon, tooltip }) });
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
          filters:
            queryRunnerParams.filters ||
            parseVariableValue(sceneGraph.lookupVariable('filters', this)?.getValue() as string),
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
