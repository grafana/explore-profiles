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
import { SceneServiceDetails } from './SceneServiceDetails';
import { SceneServicesList } from './SceneServicesList';
import { ProfileMetricVariable } from './variables/ProfileMetricVariable';

interface SceneServicesState extends EmbeddedSceneState {
  services: Services;
  isFilterVisible: boolean;
  body: SplitLayout;
}

export class SceneServices extends SceneObjectBase<SceneServicesState> {
  protected _variableDependency = new VariableDependencyConfig(this, {
    variableNames: ['profileMetric'],
    onReferencedVariableValueChanged(variable) {
      const storage = userStorage.get(userStorage.KEYS.PROFILES_EXPLORER);
      storage.profileMetric = variable.getValue();
      userStorage.set(userStorage.KEYS.PROFILES_EXPLORER, storage);
    },
  });

  constructor(timeRange: TimeRange, services: Services) {
    const storage = userStorage.get(userStorage.KEYS.PROFILES_EXPLORER) || {};

    const profileMetric = new ProfileMetricVariable({
      name: 'profileMetric',
      label: '🔥 Profile',
      isMulti: false,
      options: getProfileMetricOptions(services),
      value: storage.profileMetric || 'process_cpu:cpu:nanoseconds:cpu:nanoseconds',
    });

    const pinnedServices = storage.pinnedServices || [];
    const sortedServices = getServiceOptions(services).sort((a, b) => {
      if (pinnedServices.includes(a.value)) {
        return -1;
      }
      if (pinnedServices.includes(b.value)) {
        return +1;
      }
      return 0;
    });

    super({
      services,
      isFilterVisible: true,
      $timeRange: new SceneTimeRange({ value: timeRange }),
      $variables: new SceneVariableSet({
        variables: [profileMetric],
      }),
      controls: [
        new VariableValueSelectors({}),
        new SceneTimePicker({ isOnCanvas: true }),
        new SceneRefreshPicker({ isOnCanvas: true }),
      ],
      body: SceneServices.buildBody(
        new SceneServicesList({
          services: sortedServices,
        })
      ),
    });

    this.onFilterChange = debounce(this.onFilterChange.bind(this), 250);
  }

  static buildBody(body: SceneObject) {
    return new SplitLayout({
      direction: 'column',
      // initialSize: 0.6,
      primary: new SceneFlexItem({ body }),
    });
  }

  onFilterChange(event: any) {
    const searchText = event?.target.value.trim();
    const services = this.filterServices(searchText);

    if (!services.length) {
      this.setState({
        body: SceneServices.buildBody(
          new EmptyStateScene({
            message: `No services found for text "${searchText}"`,
          })
        ),
      });
      return;
    }

    const primaryBody = (this.state.body.state.primary as SceneFlexItem).state.body;

    if (primaryBody instanceof SceneServicesList) {
      primaryBody.update({ services });
      return;
    }

    this.setState({
      body: SceneServices.buildBody(
        new SceneServicesList({
          services,
        })
      ),
    });
  }

  filterServices(searchText: string) {
    const { services } = this.state;
    const pinnedServices = userStorage.get(userStorage.KEYS.PROFILES_EXPLORER)?.pinnedServices || [];

    const filteredOptions = searchText
      ? getServiceOptions(services).filter((service) => service.label.includes(searchText))
      : getServiceOptions(services);

    return filteredOptions.sort((a, b) => {
      if (pinnedServices.includes(a.value)) {
        return -1;
      }
      if (pinnedServices.includes(b.value)) {
        return +1;
      }
      return 0;
    });
  }

  selectService(serviceName: string, color: string) {
    this.setState({
      isFilterVisible: false,
      body: SceneServices.buildBody(
        new SceneServiceDetails({
          serviceName,
          color,
        })
      ),
    });
  }

  static Component = ({ model }: SceneComponentProps<SceneServices>) => {
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
                  placeholder="Type to filter services..."
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
    display: flex;
    flex-direction: column;
    gap: ${theme.spacing(1)};
  `,
});
