import { AUTH_FILE, ENV_VARS } from '../config/constants';
import { expect, test as setup } from '../fixtures';

setup('Authenticate', async ({ request, baseURL }) => {
  const response = await request.post(`${baseURL}/login`, {
    form: {
      user: ENV_VARS.E2E_USERNAME,
      password: ENV_VARS.E2E_PASSWORD,
    },
  });

  const responseText = await response.text();

  expect(response.ok(), `Could not log in to Grafana: ${responseText}`).toBeTruthy();

  expect.soft(response.ok(), `Could not log in to Grafana: ${responseText}`).toBeTruthy();

  await request.storageState({ path: AUTH_FILE });
});
