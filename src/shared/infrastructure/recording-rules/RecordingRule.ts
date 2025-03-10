// TODO(bryan): replace this with generate protobuf type
export type RecordingRule = {
  version: number;
  name: string;
  serviceName: string;
  profileType: string;
  matcher: string;
  labels: string[];
};
