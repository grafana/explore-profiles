import { MetaUser } from '@grafana/faro-web-sdk';
import { config } from '@grafana/runtime';

export function getUserInfo(): MetaUser {
  const { id, email, login } = config.bootData.user;

  return {
    id: String(id),
    email: email,
    username: login,
  };
}
