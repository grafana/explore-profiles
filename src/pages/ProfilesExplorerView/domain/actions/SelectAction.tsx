import { css } from '@emotion/css';
import { SceneComponentProps, SceneObject, SceneObjectBase, SceneObjectState } from '@grafana/scenes';
import { Button, IconName, useStyles2 } from '@grafana/ui';
import { reportInteraction } from '@shared/domain/reportInteraction';
import { getProfileMetric, ProfileMetricId } from '@shared/infrastructure/profile-metrics/getProfileMetric';
import { merge } from 'lodash';
import React from 'react';

import { GridItemData } from '../../components/SceneByVariableRepeaterGrid/types/GridItemData';
import { getSceneVariableValue } from '../../helpers/getSceneVariableValue';
import { interpolateQueryRunnerVariables } from '../../infrastructure/helpers/interpolateQueryRunnerVariables';
import { EventAddLabelToFilters, EventAddLabelToFiltersPayload } from '../events/EventAddLabelToFilters';
import { EventExpandPanel, EventExpandPanelPayload } from '../events/EventExpandPanel';
import { EventSelectLabel, EventSelectLabelPayload } from '../events/EventSelectLabel';
import { EventViewServiceFlameGraph, EventViewServiceFlameGraphPayload } from '../events/EventViewServiceFlameGraph';
import { EventViewServiceLabels, EventViewServiceLabelsPayload } from '../events/EventViewServiceLabels';
import { EventViewServiceProfiles, EventViewServiceProfilesPayload } from '../events/EventViewServiceProfiles';

type EventContructor =
  | (new (payload: EventAddLabelToFiltersPayload) => EventAddLabelToFilters)
  | (new (payload: EventExpandPanelPayload) => EventExpandPanel)
  | (new (payload: EventSelectLabelPayload) => EventSelectLabel)
  | (new (payload: EventViewServiceFlameGraphPayload) => EventViewServiceFlameGraph)
  | (new (payload: EventViewServiceLabelsPayload) => EventViewServiceLabels)
  | (new (payload: EventViewServiceProfilesPayload) => EventViewServiceProfiles);

type EventLookup = {
  label?: string;
  icon?: IconName;
  tooltip?: (item: GridItemData, model: SceneObject) => string;
};

const Events = new Map<EventContructor, EventLookup>([
  [
    EventAddLabelToFilters,
    Object.freeze({
      label: 'Add to filters',
      tooltip: (item, model) => {
        const groupByValue = getSceneVariableValue(model, 'groupBy');

        if (groupByValue === 'all' && item.queryRunnerParams.groupBy) {
          if (item.queryRunnerParams.groupBy) {
            const { label, values } = item.queryRunnerParams.groupBy;
            return `Add "${label}=${values[0]}" to the filters`;
          }

          return 'Add this label value to the filters'; // just in case, should not happen
        }

        return `Add "${groupByValue}=${item.label}" to the filters`;
      },
    }),
  ],
  [
    EventExpandPanel,
    Object.freeze({
      icon: 'expand-arrows',
      tooltip: () => 'Expand this panel to view all the data for the current filters',
    }),
  ],
  [EventSelectLabel, Object.freeze({ label: 'Select' })],
  [
    EventViewServiceFlameGraph,
    Object.freeze({
      label: 'Flame graph',
      tooltip: ({ queryRunnerParams }, model) => {
        const serviceName = queryRunnerParams.serviceName || getSceneVariableValue(model, 'serviceName');
        const profileMetricId = queryRunnerParams.profileMetricId || getSceneVariableValue(model, 'profileMetricId');
        return `View the "${getProfileMetric(profileMetricId as ProfileMetricId).type}" flame graph of ${serviceName}`;
      },
    }),
  ],
  [
    EventViewServiceLabels,
    Object.freeze({
      label: 'Labels',
      tooltip: ({ queryRunnerParams }, model) => {
        const serviceName = queryRunnerParams.serviceName || getSceneVariableValue(model, 'serviceName');
        return `Explore the labels of ${serviceName}`;
      },
    }),
  ],
  [
    EventViewServiceProfiles,
    Object.freeze({
      label: 'Profile types',
      tooltip: ({ queryRunnerParams }, model) => {
        const serviceName = queryRunnerParams.serviceName || getSceneVariableValue(model, 'serviceName');
        return `View the profile types of ${serviceName}`;
      },
    }),
  ],
]);

interface SelectActionState extends SceneObjectState {
  EventClass: EventContructor;
  item: GridItemData;
  label?: string;
  icon?: IconName;
  tooltip?: EventLookup['tooltip'];
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
    reportInteraction('g_pyroscope_app_select_action_clicked', { type: this.state.EventClass.name });

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
    const { label, icon, tooltip, item } = model.useState();

    return (
      <Button
        className={styles.selectButton}
        variant="primary"
        size="sm"
        fill="text"
        onClick={model.onClick}
        icon={icon}
        tooltip={tooltip?.(item, model)}
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
