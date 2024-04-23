import { css } from '@emotion/css';
import { GrafanaTheme2, TimeRange } from '@grafana/data';
import {
  EmbeddedSceneState,
  SceneComponentProps,
  SceneFlexItem,
  sceneGraph,
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
import { Icon, IconButton, Input, useStyles2 } from '@grafana/ui';
import { Services } from '@shared/infrastructure/services/servicesApiClient';
import { userStorage } from '@shared/infrastructure/userStorage';
import debounce from 'lodash.debounce';
import React from 'react';

import { EmptyStateScene } from '../EmptyState/EmptyStateScene';
import { Favorite } from '../FavAction';
import { getProfileMetricOptions } from '../getProfileMetricOptions';
import { getServiceOptions, ServiceOptions } from '../getServiceOptions';
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
      const storage = userStorage.get(userStorage.KEYS.PROFILES_EXPLORER) || {};
      storage.profileMetric = variable.getValue();
      userStorage.set(userStorage.KEYS.PROFILES_EXPLORER, storage);
    },
  });

  constructor(timeRange: TimeRange, services: Services) {
    const storage = userStorage.get(userStorage.KEYS.PROFILES_EXPLORER) || {};
    const profileMetricId = storage.profileMetric || 'process_cpu:cpu:nanoseconds:cpu:nanoseconds';

    const profileMetric = new ProfileMetricVariable({
      name: 'profileMetric',
      label: '🔥 Profile',
      isMulti: false,
      options: getProfileMetricOptions(services),
      value: profileMetricId,
    });

    const sortedServices = SceneServices.sortOptions(getServiceOptions(services), profileMetricId);

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

  static sortOptions(serviceOptions: ServiceOptions, profileMetricId: string) {
    const storage = userStorage.get(userStorage.KEYS.PROFILES_EXPLORER) || {};
    const favorites: Favorite[] = storage.favorites || [];
    const relevantFavorites = favorites.filter((f) => f.labelId === '' && f.profileMetricId === profileMetricId);

    return serviceOptions.sort((a, b) => {
      if (relevantFavorites.some((f) => f.serviceName === a.value)) {
        return -1;
      }
      if (relevantFavorites.some((f) => f.serviceName === b.value)) {
        return +1;
      }
      return 0;
    });
  }

  static buildBody(body: SceneObject) {
    return new SplitLayout({
      direction: 'column',
      // initialSize: 0.6,
      primary: new SceneFlexItem({ body }),
    });
  }

  clearSearch() {
    (document.querySelector('#search-services-input') as HTMLInputElement).value = '';
    this.onFilterChange('');
  }

  onFilterChange(searchText: string) {
    const services = this.filterServices(searchText);

    if (!services.length) {
      this.setState({
        body: SceneServices.buildBody(
          new EmptyStateScene({
            message: 'No services found',
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
    const profileMetricId = sceneGraph.lookupVariable('profileMetric', this)!.getValue() as string;

    const filteredOptions = searchText
      ? getServiceOptions(services).filter((service) => service.label.includes(searchText))
      : getServiceOptions(services);

    return SceneServices.sortOptions(filteredOptions, profileMetricId);
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
                  id="search-services-input"
                  type="text"
                  placeholder="Type to filter services..."
                  prefix={<Icon name="filter" />}
                  suffix={<IconButton name="times" aria-label="Clear search" onClick={() => model.clearSearch()} />}
                  onChange={(e: any) => model.onFilterChange(e.target.value.trim())}
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
