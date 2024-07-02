import { css } from '@emotion/css';
import { SceneComponentProps, SceneObjectBase, SceneObjectState } from '@grafana/scenes';
import { Button, IconName, useStyles2 } from '@grafana/ui';
import { merge } from 'lodash';
import React from 'react';

import { GridItemData } from '../components/SceneByVariableRepeaterGrid/GridItemData';
import { interpolateQueryRunnerVariables } from '../data/helpers/interpolateQueryRunnerVariables';
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
    Object.freeze({
      icon: 'list-ul',
      tooltip: "View the distribution of all this label's values for the current filters",
    }),
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
  skipVariablesInterpolation?: boolean;
}

export class SelectAction extends SceneObjectBase<SelectActionState> {
  constructor({
    EventClass,
    item,
    tooltip,
    skipVariablesInterpolation,
  }: {
    EventClass: EventContructor;
    item: SelectActionState['item'];
    tooltip?: SelectActionState['tooltip'];
    skipVariablesInterpolation?: SelectActionState['skipVariablesInterpolation'];
  }) {
    const lookup = Events.get(EventClass);
    if (!lookup) {
      throw new TypeError(`Unknown event class "${EventClass}"!`);
    }

    super({ EventClass, item, ...merge({}, lookup, { tooltip, skipVariablesInterpolation }) });
  }

  public onClick = () => {
    this.publishEvent(this.buildEvent(), true);
  };

  buildEvent() {
    const { EventClass, item, skipVariablesInterpolation } = this.state;

    const completeItem = {
      ...item,
      queryRunnerParams: skipVariablesInterpolation
        ? item.queryRunnerParams
        : interpolateQueryRunnerVariables(this, item),
    };

    return new EventClass({
      item: completeItem,
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
