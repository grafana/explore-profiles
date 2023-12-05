import { useAsync } from 'react-use';
import { formatAsOBject } from 'grafana-pyroscope/public/app/util/formatDate';
import {
  ProfileFormat,
  PyroscopeApiClient,
} from '../../../../../overrides/components/TagsBar/QueryBuilder/infrastructure/http/PyroscopeApiClient';

const pyroscopeApiClient = new PyroscopeApiClient();

function cleanup(profile: string) {
  console.log(`[useFetchDotProfile] initial profile size: ${profile.length}`);

  profile = profile
    .replace(/fontsize=\d+ /g, '')
    .replace(/id="node\d+" /g, '')
    .replace(/labeltooltip=".*\)" /g, '')
    .replace(/tooltip=".*\)" /g, '')
    .replace(/\{"version.*/g, '')
    .replace(/\{"version.*/g, '')
    .replace(/(N\d+ -> N\d+).*/g, '$1')
    .replace(/N\d+ \[label="other.*\n/, '')
    .replace(/shape=box /g, '')
    .replace(/fillcolor="#\w{6}"/g, '')
    .replace(/color="#\w{6}" /g, '');

  console.log(`[useFetchDotProfile] profile size after cleanup: ${profile.length}`);

  return profile;
}

export function useFetchDotProfile(query: string, from: string, until: string): ReturnType<typeof useAsync> {
  return useAsync(async () => {
    const reponse = await pyroscopeApiClient.fetchProfile(
      query,
      formatAsOBject(from).getTime(),
      formatAsOBject(until).getTime(),
      ProfileFormat.dot,
      100
    );

    let profile = await reponse.text();

    return cleanup(profile);
  }, [query, from, until]);
}
