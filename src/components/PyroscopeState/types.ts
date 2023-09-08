import { appFromQuery } from 'grafana-pyroscope/public/app/models/app';

export type AppProfileType = NonNullable<ReturnType<typeof appFromQuery>>;
