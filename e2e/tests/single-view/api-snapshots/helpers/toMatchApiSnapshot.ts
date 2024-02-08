import { expect } from '../../../../fixtures';
import { API_SNAPSHOTS } from '../snapshots-data';

export async function toMatchApiSnapshot(requestName, request, checkPostData = true) {
  if (checkPostData) {
    expect(request.postDataJSON(), requestName).toEqual(API_SNAPSHOTS[requestName].REQUEST);
  } else {
    expect(request.url(), requestName).toBe(API_SNAPSHOTS[requestName].REQUEST);
  }

  const response = await (await request.response())?.json();

  if (API_SNAPSHOTS[requestName].RESPONSE) {
    expect(response, requestName).toEqual(API_SNAPSHOTS[requestName].RESPONSE);
  }
}
