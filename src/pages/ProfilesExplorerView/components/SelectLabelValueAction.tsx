import { config } from '@grafana/runtime';
import { SceneComponentProps, SceneObjectBase, SceneObjectState } from '@grafana/scenes';
import { LinkButton } from '@grafana/ui';
import React from 'react';

interface SelectLabelValueActionState extends SceneObjectState {
  profileMetric: string;
  serviceName: string;
  labelId: string;
  labelValue: string;
  from: number;
  to: number;
}

export class SelectLabelValueAction extends SceneObjectBase<SelectLabelValueActionState> {
  static buildSingleViewUrl({
    profileMetric,
    serviceName,
    labelId,
    labelValue,
    from,
    to,
  }: SelectLabelValueActionState): string {
    let { appUrl } = config;

    if (appUrl.at(-1) !== '/') {
      // ensures that the API pathname is appended correctly (appUrl seems to always have it but better to be extra careful)
      appUrl += '/';
    }

    const singleViewUrl = new URL('a/grafana-pyroscope-app/single', appUrl);

    const query = `${profileMetric}{service_name="${serviceName}",${labelId}="${labelValue}"}`;
    singleViewUrl.searchParams.set('query', query);

    singleViewUrl.searchParams.set('from', String(from));
    singleViewUrl.searchParams.set('until', String(to));

    return singleViewUrl.toString();
  }

  public static Component = ({ model }: SceneComponentProps<SelectLabelValueAction>) => {
    const href = SelectLabelValueAction.buildSingleViewUrl(model.state);

    return (
      <LinkButton variant="secondary" size="sm" fill="solid" href={href}>
        View flame graph
      </LinkButton>
    );
  };
}
