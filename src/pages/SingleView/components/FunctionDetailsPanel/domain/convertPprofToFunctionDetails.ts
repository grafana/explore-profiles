import { PLACEHOLDER_COMMIT_DATA } from '@shared/components/GitHubContextProvider/infrastructure/PrivateVcsClient';
import { Function, Location, Mapping, PprofProfile, Sample } from '@shared/types/PprofProfile';

import { CallSiteProps, FunctionDetails } from '../types/FunctionDetails';

const buildDetails = (profile: PprofProfile, func: Function, mapping?: Mapping) => {
  let version;

  try {
    version = mapping ? JSON.parse(profile.stringTable[Number(mapping.buildId)]) : undefined;
  } catch {}

  return {
    name: profile.stringTable[Number(func.name)],
    version,
    startLine: !Number.isNaN(Number(func.startLine)) ? Number(func.startLine) : undefined,
    fileName: profile.stringTable[Number(func.filename)],
    callSites: new Map<number, CallSiteProps>(),
    unit: profile.stringTable[Number(profile.sampleType[0].unit)],
    commit: PLACEHOLDER_COMMIT_DATA,
  };
};

function convertSample(
  fnName: string,
  profile: PprofProfile,
  locations: Map<string, Location>,
  functions: Map<string, Function>,
  mappings: Map<string, Mapping>,
  sample: Sample,
  versions: Map<string, FunctionDetails>
) {
  const locationIdSet = new Set();

  sample.locationId.forEach((locationId, index) => {
    const location = locations.get(locationId);
    if (!location) {
      return;
    }

    const func = functions.get(location.line[0].functionId);
    if (!func) {
      return;
    }

    if (profile.stringTable[Number(func.name)] !== fnName) {
      return;
    }

    // https://github.com/google/pprof/blob/main/doc/README.md#details
    if (locationIdSet.has(locationId)) {
      return;
    }

    locationIdSet.add(locationId);

    const details = versions.get(location.mappingId) || buildDetails(profile, func, mappings.get(location.mappingId));

    const lineNumber = Number(location.line[0].line);

    const callSite = details.callSites.get(lineNumber) || {
      line: Number(location.line[0].line),
      flat: 0,
      cum: 0,
    };

    // if the function we're interested in is at the leaf node (index=0), we have its flat value...
    const flat = index === 0 ? Number(sample.value[0]) : 0; // value of the location itself

    // ...if not, that's its cum value
    // locations above the leaf node don't contribute to the sample value (their self is 0)
    // this is what the API returns
    const cum = Number(sample.value[0]); // value of the location plus all its descendants

    callSite.flat += flat;
    callSite.cum += cum;

    details.callSites.set(lineNumber, callSite);

    versions.set(location.mappingId, details);
  });
}

export function convertPprofToFunctionDetails(fnName: string, profile: PprofProfile): FunctionDetails[] {
  const versions = new Map<string, FunctionDetails>();

  const locations = new Map(profile.location?.map((l) => [l.id, l]));
  const functions = new Map(profile.function?.map((f) => [f.id, f]));
  const mappings = new Map(profile.mapping?.map((m) => [m.id, m]));

  profile.sample
    // Sometimes a sample may not have a stack trace associated with it. This
    // may be a bug in the Pyroscope API or it may be an idiosyncrasy of the pprof format.
    // While it may cause some counting errors, let's skip these for now.
    ?.filter((sample) => sample.locationId !== undefined)
    .forEach((sample) => convertSample(fnName, profile, locations, functions, mappings, sample, versions));

  return Array.from(versions.values());
}
