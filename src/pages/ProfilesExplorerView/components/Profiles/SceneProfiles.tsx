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
import { getProfileMetricOptions, ProfileMetricOptions } from '../getProfileMetricOptions';
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
      const storage = userStorage.get(userStorage.KEYS.PROFILES_EXPLORER) || {};
      storage.service = variable.getValue();
      userStorage.set(userStorage.KEYS.PROFILES_EXPLORER, storage);
    },
  });

  constructor(timeRange: TimeRange, services: Services) {
    const storage = userStorage.get(userStorage.KEYS.PROFILES_EXPLORER) || {};
    const serviceOptions = getServiceOptions(services);
    const serviceName = storage.service || serviceOptions[0].value;

    const serviceMetric = new ServiceNameVariable({
      name: 'serviceName',
      label: '💡 Service',
      isMulti: false,
      options: serviceOptions,
      value: serviceName,
    });

    const sortedProfileMetrics = SceneProfiles.sortOptions(getProfileMetricOptions(services), serviceName);

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

  static sortOptions(profileMetricOptions: ProfileMetricOptions, serviceName: string) {
    const storage = userStorage.get(userStorage.KEYS.PROFILES_EXPLORER) || {};
    const favorites: Favorite[] = storage.favorites || [];
    const relevantFavorites = favorites.filter((f) => f.labelId === '' && f.serviceName === serviceName);

    return profileMetricOptions.sort((a, b) => {
      if (relevantFavorites.some((f) => f.profileMetricId === a.value)) {
        return -1;
      }
      if (relevantFavorites.some((f) => f.profileMetricId === b.value)) {
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
    (document.querySelector('#search-profiles-input') as HTMLInputElement).value = '';
    this.onFilterChange('');
  }

  onFilterChange(searchText: string) {
    const profileMetrics = this.filterProfileMetrics(searchText);

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
    const serviceName = sceneGraph.lookupVariable('serviceName', this)!.getValue() as string;

    const filteredOptions = searchText
      ? getProfileMetricOptions(services).filter((service) => service.label.includes(searchText))
      : getProfileMetricOptions(services);

    return SceneProfiles.sortOptions(filteredOptions, serviceName);
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
                  id="search-profiles-input"
                  type="text"
                  placeholder="Type to filter profile metrics..."
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
