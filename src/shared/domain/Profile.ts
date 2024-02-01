type Sample = {
  locationId: string[];
  value: string[];
};

type SampleType = {
  type: string;
  unit: string;
};

type Function = {
  id: string;
  name: string;
  systemName: string;
  filename: string;
  startLine: string;
};

type Location = {
  id: string;
  mappingId: string;
  line: Line[];
};

type Line = {
  functionId: string;
  line: string;
};

type Mapping = {
  id: string;
  buildId: string;
};

type PprofProfile = {
  function: Function[];
  location: Location[];
  mapping: Mapping[];
  sample: Sample[];
  stringTable: string[];
  defaultSampleType: string;
  sampleType: SampleType[];
};

export { PprofProfile };
