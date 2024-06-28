import { css } from '@emotion/css';
import { config } from '@grafana/runtime';
import {
  SceneComponentProps,
  SceneCSSGridLayout,
  sceneGraph,
  SceneObjectBase,
  SceneObjectState,
  VariableDependencyConfig,
} from '@grafana/scenes';
import { Checkbox, LinkButton, Tooltip, useStyles2 } from '@grafana/ui';
import { buildQuery } from '@shared/domain/url-params/parseQuery';
import { uniq } from 'lodash';
import React, { useMemo } from 'react';

import { GridItemData } from '../components/SceneByVariableRepeaterGrid/GridItemData';
import { interpolateQueryRunnerVariables } from '../data/helpers/interpolateQueryRunnerVariables';
import { computeRoundedTimeRange } from '../helpers/computeRoundedTimeRange';
import { findSceneObjectByClass } from '../helpers/findSceneObjectByClass';
import { FiltersVariable } from '../variables/FiltersVariable/FiltersVariable';

interface CompareActionState extends SceneObjectState {
  item: GridItemData;
  isChecked: boolean;
  isDisabled: boolean;
  isEnabled: boolean;
  diffUrl: string;
}

export class CompareAction extends SceneObjectBase<CompareActionState> {
  protected _variableDependency: VariableDependencyConfig<CompareActionState> = new VariableDependencyConfig(this, {
    variableNames: ['filters'],
    onReferencedVariableValueChanged: () => {
      if (!this.state.isChecked) {
        return;
      }

      const { otherCheckedAction } = this.findCompareActions();

      if (otherCheckedAction?.state.isChecked) {
        const diffUrl = this.buildDiffUrl(otherCheckedAction.state.item);

        this.setState({ diffUrl });
        otherCheckedAction.setState({ diffUrl });
      }
    },
  });

  constructor({ item }: { item: CompareActionState['item'] }) {
    super({
      item,
      isChecked: false,
      isDisabled: false,
      isEnabled: false,
      diffUrl: '',
    });
  }

  public onChange = () => {
    let { isChecked } = this.state;

    isChecked = !isChecked;

    this.setState({ isChecked });

    const { otherCheckedAction, allOtherActions } = this.findCompareActions();

    const isEnabled = isChecked && Boolean(otherCheckedAction);

    const newState = {
      diffUrl: isEnabled ? this.buildDiffUrl(otherCheckedAction!.state.item) : '',
      isEnabled,
      isDisabled: false,
    };

    this.setState(newState);
    otherCheckedAction?.setState(newState);

    allOtherActions.forEach((action) => action.setState({ isDisabled: isEnabled }));
  };

  findCompareActions() {
    let otherCheckedAction: CompareAction | undefined;

    const allOtherActions = sceneGraph.findAllObjects(sceneGraph.getAncestor(this, SceneCSSGridLayout), (o) => {
      if (!(o instanceof CompareAction) || o === this) {
        return false;
      }

      if (o.state.isChecked) {
        otherCheckedAction = o;
        return false;
      }

      return true;
    }) as CompareAction[];

    return {
      otherCheckedAction,
      allOtherActions,
    };
  }

  buildDiffUrl(otherItem: GridItemData) {
    let { appUrl } = config;
    if (appUrl.at(-1) !== '/') {
      // ensures that the API pathname is appended correctly (appUrl seems to always have it but better to be extra careful)
      appUrl += '/';
    }

    const diffUrl = new URL('a/grafana-pyroscope-app/comparison-diff', appUrl);

    // time range
    const { from, to } = computeRoundedTimeRange(sceneGraph.getTimeRange(this).state.value);
    diffUrl.searchParams.set('from', from.toString());
    diffUrl.searchParams.set('to', to.toString());

    const { filters: queryFilters } = (findSceneObjectByClass(this, FiltersVariable) as FiltersVariable).state;
    const { serviceName: serviceId, profileMetricId } = interpolateQueryRunnerVariables(this, this.state.item);

    // query - just in case
    const query = buildQuery({
      serviceId,
      profileMetricId,
      labels: queryFilters.map(({ key, operator, value }) => `${key}${operator}"${value}"`),
    });
    diffUrl.searchParams.set('query', query);

    // left & right queries
    const [leftQuery, rightQuery] = [this.state.item, otherItem]
      .sort((a, b) => a.index - b.index)
      .map((item) => {
        const labels = [...queryFilters, ...(item.queryRunnerParams.filters || [])].map(
          ({ key, operator, value }) => `${key}${operator}"${value}"`
        );

        return buildQuery({ serviceId, profileMetricId, labels: uniq(labels) });
      });

    diffUrl.searchParams.set('leftQuery', leftQuery);
    diffUrl.searchParams.set('rightQuery', rightQuery);

    return diffUrl.toString();
  }

  public static Component = ({ model }: SceneComponentProps<CompareAction>) => {
    const styles = useStyles2(getStyles);
    const { isChecked, isDisabled, isEnabled, diffUrl } = model.useState();

    const tooltipContent = useMemo(() => {
      if (isDisabled) {
        return 'Two grid items have already been selected for flame graphs comparison';
      }
      if (isEnabled) {
        return 'Click to view the flame graphs comparison of the selected grid items';
      }
      return 'Select two grid items to enable flame graphs comparison';
    }, [isDisabled, isEnabled]);

    return (
      <Tooltip content={tooltipContent} placement="top">
        <div className={styles.checkBoxWrapper}>
          <Checkbox value={isChecked} disabled={isDisabled} onChange={model.onChange} />

          {isEnabled && (
            <LinkButton variant="primary" size="sm" fill="text" href={diffUrl} target="_blank">
              Compare
            </LinkButton>
          )}
        </div>
      </Tooltip>
    );
  };
}

const getStyles = () => ({
  checkBoxWrapper: css`
    display: flex;
    align-items: center;
  `,
});
