export type DataSourceDef = {
  type: string;
  uid: string;
};

export const PYROSCOPE_DATA_SOURCE: DataSourceDef = Object.freeze({
  type: 'grafana-pyroscope-datasource',
  uid: '$dataSource', // interpolated variable
});

export const PYROSCOPE_SERVICES_DATA_SOURCE: DataSourceDef = Object.freeze({
  type: 'pyroscope-services-datasource',
  uid: 'pyroscope-services-datasource',
});

export const PYROSCOPE_PROFILE_METRICS_DATA_SOURCE: DataSourceDef = Object.freeze({
  type: 'pyroscope-profile-metrics-datasource',
  uid: 'pyroscope-profile-metrics-datasource',
});

export const PYROSCOPE_PROFILE_FAVORIES_DATA_SOURCE: DataSourceDef = Object.freeze({
  type: 'pyroscope-favorites-datasource',
  uid: 'pyroscope-favorites-datasource',
});

export const PYROSCOPE_LABELS_DATA_SOURCE: DataSourceDef = Object.freeze({
  type: 'pyroscope-labels-datasource',
  uid: 'pyroscope-labels-datasource',
});
