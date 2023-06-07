// Disable redux-query-sync since sidebar items don't allow passing query params
// Therefore changing a route ends up removing the query params, which removes from the store
// For more info see https://github.com/grafana/pyroscope-app-plugin/issues/18
export default () => {};
