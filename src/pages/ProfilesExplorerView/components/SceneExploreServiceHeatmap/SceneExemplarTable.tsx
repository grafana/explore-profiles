import { css } from '@emotion/css';
import {
  DataQueryRequest,
  DataQueryResponse,
  DataSourceApi,
  Field,
  getValueFormat,
  GrafanaTheme2,
} from '@grafana/data';
import { t } from '@grafana/i18n';
import { getDataSourceSrv } from '@grafana/runtime';
import { SceneComponentProps, sceneGraph, SceneObjectBase, SceneObjectState } from '@grafana/scenes';
import { Field as FormField, IconButton, Select, Spinner, useStyles2 } from '@grafana/ui';
import { getProfileMetric } from '@shared/infrastructure/profile-metrics/getProfileMetric';
import React, { useCallback, useState } from 'react';
import { lastValueFrom, Observable } from 'rxjs';

import { EventViewServiceFlameGraph } from '../../domain/events/EventViewServiceFlameGraph';
import { FiltersVariable } from '../../domain/variables/FiltersVariable/FiltersVariable';
import { ProfileIdSelectorVariable } from '../../domain/variables/ProfileIdSelectorVariable';
import { SpanSelectorVariable } from '../../domain/variables/SpanSelectorVariable';
import { PanelType } from '../SceneByVariableRepeaterGrid/components/ScenePanelTypeSwitcher';
import { buildUnitFormatter } from '../SceneExploreServiceFlameGraph/components/SceneFunctionDetailsPanel/domain/buildUnitFormatter';
import { ExemplarRow } from './infrastructure/buildHeatmapDataFrames';
import { SceneExploreServiceHeatmap } from './SceneExploreServiceHeatmap';

interface TraceInfo {
  traceId: string;
  spanName?: string;
  duration?: number;
}

interface TempoDatasource {
  uid: string;
  name: string;
}

interface SceneExemplarTableState extends SceneObjectState {
  rows: ExemplarRow[];
  traceInfoBySpanId: Record<string, TraceInfo | null>;
  loadingSpanIds: string[];
  tempoDatasources: TempoDatasource[];
  tempoDataSourceUid?: string;
}

function formatTimestamp(ms: number): string {
  return new Date(ms).toLocaleTimeString();
}

function CopyableId({ value, display }: { value: string; display: string }) {
  const [copied, setCopied] = useState(false);
  const styles = useStyles2(getCopyableStyles);

  const handleCopy = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      navigator.clipboard.writeText(value).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      });
    },
    [value]
  );

  return (
    <span className={styles.wrapper} title={value} onClick={handleCopy}>
      <span className={styles.text}>{display}</span>
      <IconButton
        name={copied ? 'check' : 'clipboard-alt'}
        tooltip={
          copied
            ? t('heatmap.exemplar-table.copied', 'Copied!')
            : t('heatmap.exemplar-table.copy-to-clipboard', 'Copy to clipboard')
        }
        size="xs"
        className={copied ? styles.iconCopied : styles.icon}
        onClick={handleCopy}
      />
    </span>
  );
}

const getCopyableStyles = (theme: GrafanaTheme2) => ({
  wrapper: css`
    display: inline-flex;
    align-items: center;
    gap: ${theme.spacing(0.5)};
    cursor: pointer;
    border-radius: ${theme.shape.radius.default};
    padding: ${theme.spacing(0, 0.25)};
    &:hover {
      background: ${theme.colors.action.hover};
    }
  `,
  text: css`
    font-family: ${theme.typography.fontFamilyMonospace};
    font-size: ${theme.typography.bodySmall.fontSize};
  `,
  icon: css`
    color: ${theme.colors.text.secondary};
    opacity: 0;
    .wrapper:hover & {
      opacity: 1;
    }
  `,
  iconCopied: css`
    color: ${theme.colors.success.text};
  `,
});

export class SceneExemplarTable extends SceneObjectBase<SceneExemplarTableState> {
  private traceLookupRequestId = 0;

  constructor() {
    super({
      key: 'exemplar-table',
      rows: [],
      traceInfoBySpanId: {},
      loadingSpanIds: [],
      tempoDatasources: [],
      tempoDataSourceUid: undefined,
    });

    this.addActivationHandler(this.onActivate.bind(this));
  }

  onActivate() {
    const allDatasources = getDataSourceSrv().getList({ pluginId: 'tempo' });
    const tempoDatasources = allDatasources.map((ds) => ({ uid: ds.uid, name: ds.name }));
    this.setState({ tempoDatasources });

    let parent: SceneExploreServiceHeatmap | undefined;
    try {
      parent = sceneGraph.getAncestor(this, SceneExploreServiceHeatmap);
    } catch {
      return;
    }

    const parentSub = parent.subscribeToState((newState, prevState) => {
      if (newState.exemplarRows !== prevState.exemplarRows) {
        this.handleNewExemplarRows(newState.exemplarRows);
      }
    });

    this.handleNewExemplarRows(parent.state.exemplarRows);

    return () => {
      parentSub.unsubscribe();
    };
  }

  private handleNewExemplarRows(rows: ExemplarRow[]) {
    this.invalidateTraceInfo();
    const spanIds = [...new Set(rows.filter((r) => r.spanId).map((r) => r.spanId!))];
    this.setState({ rows, traceInfoBySpanId: {}, loadingSpanIds: [] });

    const { tempoDataSourceUid } = this.state;
    if (tempoDataSourceUid) {
      if (spanIds.length > 0) {
        this.lookupTraceInfo(spanIds);
      }
    }
  }

  private invalidateTraceInfo() {
    this.traceLookupRequestId++;
  }

  setTempoDataSourceUid(tempoDataSourceUid?: string) {
    if (tempoDataSourceUid === this.state.tempoDataSourceUid) {
      return;
    }

    this.invalidateTraceInfo();

    const spanIds = [...new Set(this.state.rows.filter((row) => row.spanId).map((row) => row.spanId!))];

    this.setState({ tempoDataSourceUid, traceInfoBySpanId: {}, loadingSpanIds: [] });

    try {
      const parent = sceneGraph.getAncestor(this, SceneExploreServiceHeatmap);
      parent.setState({ tempoDataSourceUid, selectedTraceId: undefined });
    } catch {
      // outside expected parent hierarchy
    }

    if (tempoDataSourceUid && spanIds.length > 0) {
      this.lookupTraceInfo(spanIds);
    }
  }

  lookupTraceInfo(spanIds: string[]) {
    const { tempoDataSourceUid } = this.state;
    if (!tempoDataSourceUid || spanIds.length === 0) {
      return;
    }

    const requestId = this.traceLookupRequestId;
    const requestTempoDataSourceUid = tempoDataSourceUid;

    const conditions = spanIds.map((id) => `span:id="${id}"`).join(' || ');
    const query = `{${conditions}}`;

    this.setState({ loadingSpanIds: [...this.state.loadingSpanIds, ...spanIds] });

    // eslint-disable-next-line sonarjs/cognitive-complexity
    (async () => {
      try {
        const ds: DataSourceApi = await getDataSourceSrv().get(tempoDataSourceUid);
        const timeRange = sceneGraph.getTimeRange(this).state.value;

        const request = {
          requestId: 'span-trace-lookup',
          targets: [
            {
              refId: 'A',
              queryType: 'traceql',
              tableType: 'spans',
              query,
              limit: spanIds.length,
              datasource: { type: 'tempo', uid: tempoDataSourceUid },
            },
          ],
          range: timeRange,
          interval: '1s',
          intervalMs: 1000,
          maxDataPoints: spanIds.length,
          scopedVars: {},
          timezone: 'browser',
          app: 'explore',
          startTime: Date.now(),
        } as unknown as DataQueryRequest;

        const result = ds.query(request) as Observable<DataQueryResponse> | Promise<DataQueryResponse>;
        const response: DataQueryResponse =
          result instanceof Promise ? await result : await lastValueFrom(result as Observable<DataQueryResponse>);

        const traceInfoBySpanId: Record<string, TraceInfo | null> = {};

        for (const frame of response?.data ?? []) {
          const traceIdField = frame.fields.find((f: Field) => f.name === 'traceIdHidden');
          const spanIdField = frame.fields.find((f: Field) => f.name === 'spanID');
          const spanNameField = frame.fields.find((f: Field) => f.name === 'name');
          const durationField = frame.fields.find((f: Field) => f.name === 'duration');

          if (traceIdField && spanIdField) {
            for (let i = 0; i < frame.length; i++) {
              const spanId = spanIdField.values[i];
              const traceId = traceIdField.values[i];
              if (spanId && traceId) {
                traceInfoBySpanId[spanId] = {
                  traceId,
                  spanName: spanNameField?.values[i],
                  duration: durationField?.values[i],
                };
              }
            }
          }
        }

        for (const spanId of spanIds) {
          if (!(spanId in traceInfoBySpanId)) {
            traceInfoBySpanId[spanId] = null;
          }
        }

        if (requestId !== this.traceLookupRequestId || requestTempoDataSourceUid !== this.state.tempoDataSourceUid) {
          return;
        }

        this.setState({
          traceInfoBySpanId: { ...this.state.traceInfoBySpanId, ...traceInfoBySpanId },
          loadingSpanIds: this.state.loadingSpanIds.filter((id) => !spanIds.includes(id)),
        });
      } catch {
        const notFound = Object.fromEntries(spanIds.map((id) => [id, null]));

        if (requestId !== this.traceLookupRequestId || requestTempoDataSourceUid !== this.state.tempoDataSourceUid) {
          return;
        }

        this.setState({
          traceInfoBySpanId: { ...this.state.traceInfoBySpanId, ...notFound },
          loadingSpanIds: this.state.loadingSpanIds.filter((id) => !spanIds.includes(id)),
        });
      }
    })();
  }

  openFlameGraph(profileId: string, spanId?: string, timestamp?: number) {
    let parent: SceneExploreServiceHeatmap | undefined;
    try {
      parent = sceneGraph.getAncestor(this, SceneExploreServiceHeatmap);
    } catch {}

    if (parent?.state.embedded) {
      if (spanId) {
        parent.setState({ selectedSpanId: spanId, selectedProfileId: profileId, selectedTimestamp: timestamp });
        return;
      }

      sceneGraph.findByKeyAndType(this, 'profileIdSelector', ProfileIdSelectorVariable).changeValueTo(profileId);
      sceneGraph.findByKeyAndType(this, 'spanSelector', SpanSelectorVariable).reset();
      return;
    }

    const serviceName = sceneGraph.interpolate(this, '$serviceName');
    const profileMetricId = sceneGraph.interpolate(this, '$profileMetricId');
    const filters = sceneGraph.findByKeyAndType(this, 'filters', FiltersVariable).state.filters ?? [];

    this.publishEvent(
      new EventViewServiceFlameGraph({
        item: {
          index: 0,
          value: serviceName,
          label: serviceName,
          panelType: PanelType.TIMESERIES,
          queryRunnerParams: {
            serviceName,
            profileMetricId,
            filters,
            profileIdSelector: profileId,
            spanSelector: spanId,
          },
        },
      }),
      true
    );
  }

  static Component({ model }: SceneComponentProps<SceneExemplarTable>) {
    const styles = useStyles2(getStyles);
    const { rows, traceInfoBySpanId, loadingSpanIds, tempoDatasources, tempoDataSourceUid } = model.useState();

    let selectedSpanId: string | undefined;
    let selectedTimestamp: number | undefined;
    let parent: SceneExploreServiceHeatmap | undefined;
    try {
      parent = sceneGraph.getAncestor(model, SceneExploreServiceHeatmap);
      const parentState = parent.useState();
      selectedSpanId = parentState.selectedSpanId;
      selectedTimestamp = parentState.selectedTimestamp;
    } catch {
      // outside expected parent hierarchy
    }

    const openTrace = (spanId: string | undefined) => {
      if (!parent || !spanId) {
        return;
      }
      const traceId = traceInfoBySpanId[spanId]?.traceId;
      parent.setState({
        selectedSpanId: spanId,
        selectedTimestamp: undefined,
        selectedProfileId: undefined,
        selectedTraceId: traceId,
        tempoDataSourceUid: tempoDataSourceUid,
      });
    };

    const dsOptions = tempoDatasources.map((ds: TempoDatasource) => ({ label: ds.name, value: ds.uid }));

    const profileMetricId = sceneGraph.interpolate(model, '$profileMetricId');
    const { unit, description } = getProfileMetric(profileMetricId as any);
    const formatter = buildUnitFormatter(unit);
    const formatValue = (v: number) => {
      const { text, suffix } = formatter(v, 2);
      return `${text}${suffix ?? ''}`;
    };

    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <span className={styles.title}>{t('heatmap.exemplar-table.title', 'Top span exemplars')}</span>
          <div className={styles.picker}>
            <FormField
              label={t('heatmap.exemplar-table.tempo-datasource', 'Tempo datasource')}
              className={styles.pickerField}
            >
              <Select
                className={styles.pickerSelect}
                options={dsOptions}
                value={tempoDataSourceUid ?? null}
                onChange={(option) => {
                  model.setTempoDataSourceUid(option?.value ?? undefined);
                }}
                placeholder={t('heatmap.exemplar-table.tempo-placeholder', 'Select Tempo datasource…')}
                isClearable
              />
            </FormField>
          </div>
        </div>

        {rows.length === 0 ? (
          <div className={styles.empty}>
            {t('heatmap.exemplar-table.empty', 'No span exemplars in the selected time range.')}
          </div>
        ) : (
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>{t('heatmap.exemplar-table.col-timestamp', 'Timestamp')}</th>
                  <th>{t('heatmap.exemplar-table.col-span-id', 'Span ID')}</th>
                  <th>{t('heatmap.exemplar-table.col-span-name', 'Span name')}</th>
                  <th>{description || 'Value'}</th>
                  <th>{t('heatmap.exemplar-table.col-duration', 'Duration')}</th>
                  <th>{t('heatmap.exemplar-table.col-trace-id', 'Trace ID')}</th>
                  <th>{t('heatmap.exemplar-table.col-actions', 'Actions')}</th>
                </tr>
              </thead>
              <tbody>
                {/* eslint-disable-next-line sonarjs/cognitive-complexity */}
                {rows.map((row: ExemplarRow, i: number) => {
                  const traceInfo = row.spanId ? traceInfoBySpanId[row.spanId] : undefined;
                  const isLoading = row.spanId ? loadingSpanIds.includes(row.spanId) : false;
                  const isSelected =
                    !!row.spanId && row.spanId === selectedSpanId && row.timestamp === selectedTimestamp;

                  return (
                    <tr
                      key={`${row.spanId ?? row.profileId}-${i}`}
                      className={isSelected ? styles.selectedRow : styles.clickableRow}
                      onClick={() => {
                        if (!parent || !row.spanId) {
                          return;
                        }
                        const isSelectedRow = row.spanId === selectedSpanId && row.timestamp === selectedTimestamp;
                        parent.setState({
                          selectedSpanId: isSelectedRow ? undefined : row.spanId,
                          selectedProfileId: isSelectedRow ? undefined : row.profileId,
                          selectedTimestamp: isSelectedRow ? undefined : row.timestamp,
                        });
                      }}
                    >
                      <td>{formatTimestamp(row.timestamp)}</td>
                      <td className={styles.mono}>
                        {row.spanId ? (
                          <CopyableId
                            value={row.spanId}
                            display={row.spanId.slice(0, 16) + (row.spanId.length > 16 ? '…' : '')}
                          />
                        ) : (
                          t('common.not-available', '–')
                        )}
                      </td>
                      <td>
                        {row.spanName ??
                          traceInfo?.spanName ??
                          (isLoading ? <Spinner size="sm" /> : t('common.not-available', '–'))}
                      </td>
                      <td>{formatValue(row.value)}</td>
                      <td>
                        {traceInfo?.duration !== undefined ? (
                          (() => {
                            const f = getValueFormat('ns')(traceInfo.duration, 2);
                            return `${f.text}${f.suffix ?? ''}`;
                          })()
                        ) : isLoading ? (
                          <Spinner size="sm" />
                        ) : (
                          t('common.not-available', '–')
                        )}
                      </td>
                      <td className={styles.mono}>
                        {!row.spanId ? (
                          t('common.not-available', '–')
                        ) : isLoading ? (
                          <Spinner size="sm" />
                        ) : traceInfo ? (
                          <CopyableId value={traceInfo.traceId} display={traceInfo.traceId.slice(0, 7) + '…'} />
                        ) : tempoDataSourceUid ? (
                          t('common.not-available', '–')
                        ) : (
                          <span className={styles.hint}>
                            {t('heatmap.exemplar-table.select-tempo', 'Select Tempo datasource')}
                          </span>
                        )}
                      </td>
                      <td>
                        <div className={styles.actionsCell}>
                          <IconButton
                            name="fire"
                            tooltip={t('heatmap.exemplar-table.open-flamegraph', 'Open flame graph')}
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              model.openFlameGraph(row.profileId, row.spanId, row.timestamp);
                            }}
                          />
                          {row.spanId && isLoading && <Spinner size="sm" />}
                          {row.spanId && traceInfo && (
                            <IconButton
                              name="compass"
                              tooltip={t('heatmap.exemplar-table.open-trace', 'Open trace')}
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                openTrace(row.spanId);
                              }}
                            />
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  }
}

const getStyles = (theme: GrafanaTheme2) => ({
  container: css`
    display: flex;
    flex-direction: column;
    height: 100%;
    overflow: hidden;
    background: ${theme.colors.background.primary};
  `,
  header: css`
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    gap: ${theme.spacing(2)};
    padding: ${theme.spacing(1, 2)};
    border-bottom: 1px solid ${theme.colors.border.weak};
    flex-shrink: 0;
  `,
  title: css`
    font-size: ${theme.typography.h6.fontSize};
    font-weight: ${theme.typography.fontWeightMedium};
    white-space: nowrap;
  `,
  picker: css`
    flex: 0 0 ${theme.spacing(40)};
    min-width: ${theme.spacing(32)};
  `,
  pickerField: css`
    margin-bottom: 0;

    label {
      white-space: nowrap;
    }
  `,
  pickerSelect: css`
    min-width: ${theme.spacing(32)};

    & * {
      white-space: nowrap;
    }
  `,
  tableWrapper: css`
    overflow: auto;
    flex: 1;
  `,
  table: css`
    width: 100%;
    border-collapse: collapse;
    font-size: ${theme.typography.bodySmall.fontSize};

    th,
    td {
      padding: ${theme.spacing(0.75, 1.5)};
      text-align: left;
      border-bottom: 1px solid ${theme.colors.border.weak};
      white-space: nowrap;
    }

    th {
      background: ${theme.colors.background.secondary};
      color: ${theme.colors.text.secondary};
      font-weight: ${theme.typography.fontWeightMedium};
      position: sticky;
      top: 0;
      z-index: 1;
    }

    tbody tr:hover {
      background: ${theme.colors.action.hover};
    }
  `,
  selectedRow: css`
    background: ${theme.colors.action.selected} !important;
    outline: 1px solid ${theme.colors.primary.border};
    outline-offset: -1px;
    cursor: pointer;
  `,
  clickableRow: css`
    cursor: pointer;
  `,
  mono: css`
    font-family: ${theme.typography.fontFamilyMonospace};
    font-size: ${theme.typography.bodySmall.fontSize};
  `,
  hint: css`
    color: ${theme.colors.text.disabled};
    font-style: italic;
    font-size: ${theme.typography.bodySmall.fontSize};
  `,
  actionsCell: css`
    display: flex;
    align-items: center;
    gap: ${theme.spacing(0.5)};
  `,
  empty: css`
    padding: ${theme.spacing(4)};
    text-align: center;
    color: ${theme.colors.text.secondary};
    font-style: italic;
  `,
});
