import { css } from '@emotion/css';
import { GrafanaTheme2 } from '@grafana/data';
import {
  HorizontalGroup,
  InlineField,
  InlineFieldRow,
  RefreshPicker,
  Select,
  TimeRangePicker,
  useStyles2,
} from '@grafana/ui';
import React from 'react';

import { useToolbar } from './domain/useToolbar';

const getStyles = (theme: GrafanaTheme2) => {
  return {
    toolbar: css`
      margin-bottom: ${theme.spacing(1)};
    `,
  };
};

type ToolbarProps = {
  isLoading: boolean;
  onRefresh: () => void;
};

export function Toolbar(props: ToolbarProps) {
  const styles = useStyles2(getStyles);
  const { data, actions } = useToolbar(props);

  return (
    <div className={styles.toolbar} data-testid="toolbar">
      <HorizontalGroup justify="space-between" align="flex-start">
        <InlineFieldRow>
          <InlineField label="Service" data-testid="services-dropdown">
            <Select<string>
              placeholder={data.servicePlaceHolder}
              options={data.serviceOptions}
              value={data.selectedServiceId}
              onChange={actions.selectService}
              aria-label="Services list"
            />
          </InlineField>

          <InlineField label="Profile" data-testid="profile-types-dropdown">
            <Select<string>
              placeholder={data.profilePlaceHolder}
              options={data.profileOptions}
              value={data.selectedProfileId}
              onChange={actions.selectProfile}
              aria-label="Profiles list"
            />
          </InlineField>
        </InlineFieldRow>

        <HorizontalGroup align="flex-start">
          <TimeRangePicker
            isOnCanvas={true}
            onChange={actions.setTimeRange}
            onChangeTimeZone={actions.setTimeZone}
            value={data.timeRange}
            onZoom={actions.zoom}
            onMoveBackward={actions.moveTimeRangeBackward}
            onMoveForward={actions.moveTimeRangeForward}
          />

          <RefreshPicker
            isOnCanvas={true}
            noIntervalPicker={true}
            onRefresh={actions.refresh}
            onIntervalChanged={actions.setInterval}
            isLoading={data.isLoading}
            width="36px"
          />
        </HorizontalGroup>
      </HorizontalGroup>
    </div>
  );
}
