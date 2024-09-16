import { HttpClient } from '@shared/infrastructure/http/HttpClient';
import { FlamebearerProfile } from '@shared/types/FlamebearerProfile';

type UploadResponse = {
  key: string;
  url: string;
  subProfiles: any[]; // TODO: define them, what are they?
};

class FlamegraphDotComApiClient extends HttpClient {
  constructor() {
    super('https://flamegraph.com/api', {
      'content-type': 'application/json',
    });
  }

  async upload(name: string, profile: FlamebearerProfile): Promise<UploadResponse> {
    const response = await this.fetch('/upload/v1', {
      method: 'POST',
      body: JSON.stringify({
        name,
        profile: btoa(JSON.stringify(profile)),
        fileTypeData: {
          units: profile.metadata.units,
          spyName: profile.metadata.spyName,
        },
        type: 'json',
      }),
    });

    const json = await response.json();

    return json;
  }
}

export const flamegraphDotComApiClient = new FlamegraphDotComApiClient();
