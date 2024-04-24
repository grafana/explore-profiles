import { TimeRange } from '@grafana/data';
import { config } from '@grafana/runtime';
import { SceneComponentProps, SceneObjectBase, SceneObjectState } from '@grafana/scenes';
import { LinkButton } from '@grafana/ui';
import React from 'react';

import { SceneBreakdownTabState } from '../Services/SceneBreakdownTab';

interface ViewFlameGraphActionState extends SceneObjectState {
  profileMetricId: string;
  serviceName: string;
  labelId: string;
  labelValue: string;
  timeRange: TimeRange;
  label?: string;
  labelsForDiff?: SceneBreakdownTabState['labelsForDiff'];
}

export class ViewFlameGraphAction extends SceneObjectBase<ViewFlameGraphActionState> {
  static buildUrl({
    profileMetricId,
    serviceName,
    labelId,
    labelValue,
    timeRange,
    labelsForDiff,
  }: ViewFlameGraphActionState): string {
    let { appUrl } = config;

    if (appUrl.at(-1) !== '/') {
      // ensures that the API pathname is appended correctly (appUrl seems to always have it but better to be extra careful)
      appUrl += '/';
    }

    const viewUrl = labelsForDiff?.length
      ? new URL('a/grafana-pyroscope-app/comparison-diff', appUrl)
      : new URL('a/grafana-pyroscope-app/single', appUrl);

    const query = `${profileMetricId}{service_name="${serviceName}",${labelId}="${labelValue}"}`;
    viewUrl.searchParams.set('query', query);

    const from = timeRange.from.unix() * 1000;
    const to = timeRange.to.unix() * 1000;
    viewUrl.searchParams.set('from', String(from));
    viewUrl.searchParams.set('until', String(to));

    if (labelsForDiff?.length) {
      const [leftQuery, rightQuery] = labelsForDiff.map(
        ({ id, value }) => `${profileMetricId}{service_name="${serviceName}",${id}="${value}"}`
      );

      viewUrl.searchParams.set('leftQuery', leftQuery);
      viewUrl.searchParams.set('rightQuery', rightQuery);
    }

    return viewUrl.toString();
  }

  public static Component = ({ model }: SceneComponentProps<ViewFlameGraphAction>) => {
    const state = model.useState();
    const label = state.labelsForDiff?.length ? 'View diff' : 'View flame graph';
    const href = ViewFlameGraphAction.buildUrl(state);

    return (
      <LinkButton variant="primary" size="sm" fill="text" href={href}>
        {label}
      </LinkButton>
    );
  };
}
