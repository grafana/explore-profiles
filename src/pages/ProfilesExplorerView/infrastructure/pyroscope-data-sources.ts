type DataSourceDef = {
  type: string;
  uid: string;
};

export const PYROSCOPE_DATA_SOURCE: DataSourceDef = Object.freeze({
  type: 'grafana-pyroscope-datasource',
  uid: '$dataSource', // interpolated variable
});

/* Runtime data sources */

export const PYROSCOPE_SERIES_DATA_SOURCE: DataSourceDef = Object.freeze({
  type: 'grafana-pyroscope-series-datasource',
  uid: 'grafana-pyroscope-series-datasource',
});

export const PYROSCOPE_FAVORITES_DATA_SOURCE: DataSourceDef = Object.freeze({
  type: 'grafana-pyroscope-favorites-datasource',
  uid: 'grafana-pyroscope-favorites-datasource',
});

export const PYROSCOPE_LABELS_DATA_SOURCE: DataSourceDef = Object.freeze({
  type: 'grafana-pyroscope-labels-datasource',
  uid: 'grafana-pyroscope-labels-datasource',
});
