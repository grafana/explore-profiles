import { expect } from '../../../../fixtures';
import { API_SNAPSHOTS } from '../snapshots-data';

export async function toMatchApiSnapshot(requestName, request, checkPostData = true) {
  if (checkPostData) {
    expect(request.postDataJSON(), requestName).toEqual(API_SNAPSHOTS[requestName].REQUEST);
  } else {
    const currentSearchParams = new URL(request.url()).searchParams;
    const expectedSearchParams = new URL(API_SNAPSHOTS[requestName].REQUEST).searchParams;

    expect(currentSearchParams.size, requestName).toBe(expectedSearchParams.size);

    for (const [key, value] of currentSearchParams) {
      expect(expectedSearchParams.get(key), `${requestName}: ${key}`).toBe(value);
    }
  }

  const response = await (await request.response())?.json();

  if (API_SNAPSHOTS[requestName].RESPONSE) {
    expect(response, requestName).toEqual(API_SNAPSHOTS[requestName].RESPONSE);
  }
}
