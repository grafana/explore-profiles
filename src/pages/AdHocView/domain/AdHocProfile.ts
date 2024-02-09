import { FlamebearerProfile } from '@shared/types/FlamebearerProfile';

export type AdHocProfile = {
  id: string;
  name: string;
  profileTypes: string[];
  profile: FlamebearerProfile | null;
};
