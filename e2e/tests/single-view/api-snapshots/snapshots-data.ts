export const API_SNAPSHOTS = {
  LABEL_NAMES: {
    REQUEST: {
      end: 1699705810000,
      matchers: [
        '{__profile_type__="process_cpu:cpu:nanoseconds:cpu:nanoseconds", service_name="pyroscope-rideshare-go"}',
      ],
      start: 1699688210000,
    },
    RESPONSE: {
      names: [
        '__delta__',
        '__name__',
        '__period_type__',
        '__period_unit__',
        '__profile_type__',
        '__service_name__',
        '__type__',
        '__unit__',
        'pyroscope_spy',
        'region',
        'service_name',
        'span_name',
        'vehicle',
      ],
    },
  },
  LABEL_VALUES: {
    REQUEST: {
      end: 1699705810000,
      matchers: [
        '{__profile_type__="process_cpu:cpu:nanoseconds:cpu:nanoseconds", service_name="pyroscope-rideshare-go"}',
      ],
      name: 'vehicle',
      start: 1699688210000,
    },
    RESPONSE: {
      names: ['bike', 'car', 'scooter'],
    },
  },
  RENDER_TOOLBAR_SERVICE_JAVA: {
    REQUEST:
      'http://localhost:3000/api/plugins/grafana-pyroscope-app/resources/pyroscope/render?query=process_cpu%3Acpu%3Ananoseconds%3Acpu%3Ananoseconds%7Bservice_name%3D%22pyroscope-rideshare-java%22%7D&from=1699688210000&until=1699705810000&max-nodes=16384&aggregation=sum&format=json',
  },
  RENDER_TOOLBAR_SERVICE_RUBY: {
    REQUEST:
      'http://localhost:3000/api/plugins/grafana-pyroscope-app/resources/pyroscope/render?query=process_cpu%3Asamples%3Acount%3A%3Amilliseconds%7Bservice_name%3D%22pyroscope-rideshare-ruby%22%7D&from=1699688210000&until=1699705810000&max-nodes=16384&aggregation=sum&format=json',
  },
  RENDER_TOOLBAR_PROFILE_GO_INUSE_SPACE: {
    REQUEST:
      'http://localhost:3000/api/plugins/grafana-pyroscope-app/resources/pyroscope/render?query=memory%3Ainuse_space%3Abytes%3Aspace%3Abytes%7Bservice_name%3D%22pyroscope-rideshare-go%22%7D&from=1699688210000&until=1699705810000&max-nodes=16384&aggregation=sum&format=json',
  },
  RENDER_TOOLBAR_TIMEPICKER_ZOOMOUT: {
    REQUEST:
      'http://localhost:3000/api/plugins/grafana-pyroscope-app/resources/pyroscope/render?query=process_cpu%3Acpu%3Ananoseconds%3Acpu%3Ananoseconds%7Bservice_name%3D%22pyroscope-rideshare-go%22%7D&from=1699679410&until=1699714610&max-nodes=16384&aggregation=sum&format=json',
  },
  RENDER_TOOLBAR_TIMEPICKER_BACKWARDS: {
    REQUEST:
      'http://localhost:3000/api/plugins/grafana-pyroscope-app/resources/pyroscope/render?query=process_cpu%3Acpu%3Ananoseconds%3Acpu%3Ananoseconds%7Bservice_name%3D%22pyroscope-rideshare-go%22%7D&from=1699679410&until=1699697010&max-nodes=16384&aggregation=sum&format=json',
  },
  RENDER_TOOLBAR_TIMEPICKER_FORWARDS: {
    REQUEST:
      'http://localhost:3000/api/plugins/grafana-pyroscope-app/resources/pyroscope/render?query=process_cpu%3Acpu%3Ananoseconds%3Acpu%3Ananoseconds%7Bservice_name%3D%22pyroscope-rideshare-go%22%7D&from=1699697010&until=1699714610&max-nodes=16384&aggregation=sum&format=json',
  },
  RENDER_QUERY_BUILDER: {
    REQUEST:
      'http://localhost:3000/api/plugins/grafana-pyroscope-app/resources/pyroscope/render?query=process_cpu%3Acpu%3Ananoseconds%3Acpu%3Ananoseconds%7Bservice_name%3D%22pyroscope-rideshare-go%22%2Cvehicle%3D%22scooter%22%7D&from=1699688210000&until=1699705810000&max-nodes=16384&aggregation=sum&format=json',
  },
};
