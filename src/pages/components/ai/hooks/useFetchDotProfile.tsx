import { useAsync } from 'react-use';
import { formatAsOBject } from 'grafana-pyroscope/public/app/util/formatDate';
import {
  ProfileFormat,
  PyroscopeApiClient,
} from '../../../../overrides/components/TagsBar/QueryBuilder/infrastructure/http/PyroscopeApiClient';

const pyroscopeApiClient = new PyroscopeApiClient();

function cleanup(profile: string) {
  console.log(`[useFetchDotProfile] initial profile size: ${profile.length}`);

  profile = profile
    .replace(/fontsize=\d+ /g, '')
    .replace(/id="node\d+" /g, '')
    .replace(/labeltooltip=".*\)" /g, '')
    .replace(/tooltip=".*\)" /g, '')
    .replace(/(N\d+ -> N\d+).*/g, '$1')
    .replace(/N\d+ \[label="other.*\n/, '')
    .replace(/shape=box /g, '')
    .replace(/fillcolor="#\w{6}"/g, '')
    .replace(/color="#\w{6}" /g, '');

  console.log(`[useFetchDotProfile] profile size after cleanup: ${profile.length}`);

  return profile;
}

export function useFetchDotProfile(
  query: string,
  from: string,
  until: string,
  rightQuery?: string,
  rightFrom?: string,
  rightUntil?: string
): ReturnType<typeof useAsync> {
  return useAsync(async () => {
    const profile = await pyroscopeApiClient.fetchProfile(
      query,
      formatAsOBject(from).getTime(),
      formatAsOBject(until).getTime(),
      ProfileFormat.dot,
      100
    );

    if (rightQuery && rightFrom && rightUntil) {
      const profileRight = await pyroscopeApiClient.fetchProfile(
        rightQuery,
        formatAsOBject(rightFrom).getTime(),
        formatAsOBject(rightUntil).getTime(),
        ProfileFormat.dot,
        100
      );

      return { value: cleanup(profile), valueRight: cleanup(profileRight) };
    }

    return { value: cleanup(profile) };
  }, [query, from, until]);
}
