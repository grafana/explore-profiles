import { FlamebearerProfile } from '../../../shared/types/FlamebearerProfile';

export type Profile = {
  id: string;
  name: string;
  profileTypes: string[];
  profile: FlamebearerProfile | null;
};
