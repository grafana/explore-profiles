import { css } from '@emotion/css';
import { GrafanaTheme2, TimeRange } from '@grafana/data';
import {
  EmbeddedSceneState,
  SceneComponentProps,
  SceneFlexItem,
  SceneObject,
  SceneObjectBase,
  SceneRefreshPicker,
  SceneTimePicker,
  SceneTimeRange,
  SceneVariableSet,
  SplitLayout,
  VariableDependencyConfig,
  VariableValueSelectors,
} from '@grafana/scenes';
import { Icon, Input, useStyles2 } from '@grafana/ui';
import { Services } from '@shared/infrastructure/services/servicesApiClient';
import { userStorage } from '@shared/infrastructure/userStorage';
import debounce from 'lodash.debounce';
import React from 'react';

import { EmptyStateScene } from '../EmptyState/EmptyStateScene';
import { getProfileMetricOptions } from '../getProfileMetricOptions';
import { getServiceOptions } from '../getServiceOptions';
import { SceneProfileDetails } from './SceneProfileDetails';
import { SceneProfilesList } from './SceneProfilesList';
import { ServiceNameVariable } from './variables/ServiceNameVariable';

interface SceneProfilesState extends EmbeddedSceneState {
  services: Services;
  isFilterVisible: boolean;
  body: SplitLayout;
}

export class SceneProfiles extends SceneObjectBase<SceneProfilesState> {
  protected _variableDependency = new VariableDependencyConfig(this, {
    variableNames: ['serviceName'],
    onReferencedVariableValueChanged(variable) {
      const storage = userStorage.get(userStorage.KEYS.PROFILES_EXPLORER);
      storage.service = variable.getValue();
      userStorage.set(userStorage.KEYS.PROFILES_EXPLORER, storage);
    },
  });

  constructor(timeRange: TimeRange, services: Services) {
    const storage = userStorage.get(userStorage.KEYS.PROFILES_EXPLORER) || {};

    const serviceMetric = new ServiceNameVariable({
      name: 'serviceName',
      label: '💡 Service',
      isMulti: false,
      options: getServiceOptions(services),
      value: storage.service,
    });

    const pinnedProfileMetrics = storage.pinnedProfileMetrics || [];
    const sortedProfileMetrics = getProfileMetricOptions(services).sort((a, b) => {
      if (pinnedProfileMetrics.includes(a.value)) {
        return -1;
      }
      if (pinnedProfileMetrics.includes(b.value)) {
        return +1;
      }
      return 0;
    });

    super({
      services,
      isFilterVisible: true,
      $timeRange: new SceneTimeRange({ value: timeRange }),
      $variables: new SceneVariableSet({
        variables: [serviceMetric],
      }),
      controls: [
        new VariableValueSelectors({}),
        new SceneTimePicker({ isOnCanvas: true }),
        new SceneRefreshPicker({ isOnCanvas: true }),
      ],
      body: SceneProfiles.buildBody(
        new SceneProfilesList({
          profileMetrics: sortedProfileMetrics,
        })
      ),
    });

    this.onFilterChange = debounce(this.onFilterChange.bind(this), 250);
  }

  static buildBody(body: SceneObject) {
    return new SplitLayout({
      direction: 'column',
      initialSize: 0.6,
      primary: new SceneFlexItem({ body }),
    });
  }

  onFilterChange(event: any) {
    const profileMetrics = this.filterProfileMetrics(event?.target.value.trim());

    if (!profileMetrics.length) {
      this.setState({
        body: SceneProfiles.buildBody(
          new EmptyStateScene({
            message: 'No profile metrics found',
          })
        ),
      });
      return;
    }

    const primaryBody = (this.state.body.state.primary as SceneFlexItem).state.body;

    if (primaryBody instanceof SceneProfilesList) {
      primaryBody.update({ profileMetrics });
      return;
    }

    this.setState({
      body: SceneProfiles.buildBody(
        new SceneProfilesList({
          profileMetrics,
        })
      ),
    });
  }

  filterProfileMetrics(searchText: string) {
    const { services } = this.state;
    const pinnedProfileMetrics = userStorage.get(userStorage.KEYS.PROFILES_EXPLORER)?.pinnedProfileMetrics || [];

    const filteredOptions = searchText
      ? getProfileMetricOptions(services).filter((service) => service.label.includes(searchText))
      : getProfileMetricOptions(services);

    return filteredOptions.sort((a, b) => {
      if (pinnedProfileMetrics.includes(a.value)) {
        return -1;
      }
      if (pinnedProfileMetrics.includes(b.value)) {
        return +1;
      }
      return 0;
    });
  }

  selectProfileMetric(profileMetric: { value: string; label: string }, color: string) {
    this.setState({
      isFilterVisible: false,
      body: SceneProfiles.buildBody(
        new SceneProfileDetails({
          profileMetric,
          color,
        })
      ),
    });
  }

  static Component = ({ model }: SceneComponentProps<SceneProfiles>) => {
    const styles = useStyles2(getStyles);
    const { controls, body, isFilterVisible } = model.useState();

    const [variablesControl, timePickerControl, refreshPickerControl] = controls || [];

    return (
      <div className={styles.container}>
        <div className={styles.controls}>
          <div className={styles.variablesControl}>
            <variablesControl.Component key={variablesControl.state.key} model={variablesControl} />
            {isFilterVisible && (
              <div className={styles.filter}>
                <Input
                  type="text"
                  placeholder="Type to filter profile metrics..."
                  prefix={<Icon name="filter" />}
                  onChange={model.onFilterChange}
                />
              </div>
            )}
          </div>
          <div className={styles.timeControls}>
            <timePickerControl.Component key={timePickerControl.state.key} model={timePickerControl} />
            <refreshPickerControl.Component key={refreshPickerControl.state.key} model={refreshPickerControl} />
          </div>
        </div>
        <div className={styles.body}>
          <body.Component model={body} />
        </div>
      </div>
    );
  };
}

const getStyles = (theme: GrafanaTheme2) => ({
  container: css`
    flex-grow: 1;
    display: flex;
    gap: ${theme.spacing(2)};
    min-height: 100%;
    flex-direction: column;
    padding: ${theme.spacing(2)};
  `,
  controls: css`
    display: flex;
    gap: ${theme.spacing(2)};
    flex-wrap: wrap;
    justify-content: space-between;
    align-items: flex-start;
  `,
  variablesControl: css`
    display: flex;
    gap: ${theme.spacing(1)};
    flex-grow: 1;
  `,
  filter: css`
    flex-grow: 1;
  `,
  timeControls: css`
    display: flex;
  `,
  body: css`
    flex-grow: 1;
    display: flex;
    flex-direction: column;
    gap: ${theme.spacing(1)};
  `,
});
