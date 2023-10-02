# this file is based on the one from grafana/phlare

local dockerGoImage = 'golang:1.20.4';
local dockerGrafanaImage = 'grafana/grafana:9.4.2';
local dockerNodeImage = 'node:19-bullseye';
local dockerE2EImage = 'mcr.microsoft.com/playwright:v1.29.2-focal';
local dockerGrafanaPluginCIImage = 'grafana/grafana-plugin-ci-e2e:latest';

local step(name, commands, image=dockerGoImage) = {
  name: name,
  commands: commands,
  image: image,
};

local pipeline(name, steps=[], services=[]) = {
  kind: 'pipeline',
  type: 'docker',
  name: name,
  services: services,
  steps: [step('runner identification', ['echo $DRONE_RUNNER_NAME'], 'alpine')] + steps,
  trigger+: {
    ref+: [
      'refs/heads/main',
      'refs/pull/**',
      'refs/tags/v*.*.*',
      'refs/tags/weekly-f*',
    ],
  },
};

local mainOnly = {
  when: {
    ref+: [
      'refs/heads/main',
      'refs/pull/2/head',
    ],
  },
};

local mainOrReleaseOnly = {
  when: {
    ref+: [
      'refs/heads/main',
      'refs/pull/2/head',
      'refs/tags/v*.*.*',
      'refs/tags/weekly-f*',
    ],
  },
};

local releaseOnly = {
  when: {
    event: ['tag'],
    ref+: [
      'refs/tags/v*.*.*',
      'refs/tags/weekly-f*',
    ],
  },
};

local nonReleaseOnly = {
  when: {
    event: {
      exclude: ['tag'],
    },
  },
};


local cronOnly = {
  when: {
    event: ['cron'],
  },
};

local prOnly = {
  when: {
    event: {
      include: ['pull_request'],
    },
  },
};
// promoteOnly triggers pipelines only on promotion. Various deployment steps
// are tagged with this, so that we can optionally tell Drone to
// deploy to different environments by promoting a build.
//
// This can be achieved by running:
//
//   drone build promote grafana/pyroscope-app-plugin <build> <target>
//
// after setting up your Drone CLI following the instructions at
// https://drone.grafana.net/account, or by using the 'Promote' option
// of a successful build of 'main' in the Drone UI and specifying
// the target.
//
// For deployments, the target name is the wave name, e.g. 'ops', 'prod', etc.
local promoteOnly(target) = {
  trigger: { event: ['promote'], target: [target] },
};

local vault_secret(name, vault_path, key) = {
  kind: 'secret',
  name: name,
  get: {
    path: vault_path,
    name: key,
  },
};


// NB: Former deployStep() replaced by argo-workflows api call using argo-cli container
//     as `argoWorkflowStep('phlare-cd', 'deploy-<wave>-envs')`, with <wave> in ['dev', 'ops', 'prod'] see:
//     - https://argo-workflows.grafana.net/workflow-templates/phlare-cd
//       built from https://github.com/grafana/deployment_tools/tree/master/ksonnet/environments/phlare-cd
//     - https://argo-workflows.grafana.net/workflows/phlare-cd
//       for the actual workflows runs
local argoWorkflowStep(namespace, name) = {
  name: 'launch %s workflow' % name,
  image: 'us.gcr.io/kubernetes-dev/drone/plugins/argo-cli',
  settings: {
    namespace: namespace,
    token: {
      from_secret: 'argo_token',
    },
    log_level: 'debug',
    command: if name == 'deploy-plugin-dev' then
      'submit --from workflowtemplate/%(name)s --name %(name)s-${DRONE_COMMIT} --parameter dockertag=$(cat .tag) --parameter plugintag=${DRONE_COMMIT}' % { name: name }
    else
      'submit --from workflowtemplate/%(name)s --name %(name)s-$(cat .tag) --parameter dockertag=$(cat .tag) --parameter plugintag=$(cat .tag)' % { name: name },
    add_ci_labels: true,
  },
  depends_on: [
    'generate tags',
  ],
};

local deployStep(envsGroup) = argoWorkflowStep('phlare-cd', 'deploy-plugin-%s' % envsGroup);

local generateTagsStep(depends_on=[]) = step('generate tags', [
  'git fetch origin --tags',
  'git status --porcelain --untracked-files=no',
  'git diff --no-ext-diff --quiet',  // fail if the workspace has modified files
  './scripts/version',
  "./scripts/version | tr -d '\n' > .tag",
  '{ echo -n latest, ; echo -n ${DRONE_COMMIT}, ; ./scripts/version ; } > .tags',  // save version in special file for docker plugin
  'cat .tags',
]) + { depends_on: depends_on };

// Main array of drone pipelines
[
  pipeline('build packages', [
    generateTagsStep(),

    step('install dependencies', [
      'yarn install --immutable',
    ], image=dockerNodeImage),

    step('build backend packages', [
      // 'mage -v test',
      'mage -v build:linux',
    ], image=dockerGrafanaPluginCIImage),

    step('build frontend packages', [
      'echo "export const GIT_COMMIT = \'${DRONE_COMMIT}\';" > src/version.ts',
      'yarn build',
    ], image=dockerNodeImage) + {
      depends_on: [
        'install dependencies',
        'build backend packages',
      ],
    } + nonReleaseOnly,

    step('build frontend packages (with tag)', [
      'export NODE_ENV=production',
      'echo "" > src/version.ts',
      'yarn build',
    ], image=dockerNodeImage) + {
      depends_on: [
        'install dependencies',
        'build backend packages',
      ],
    } + releaseOnly,

    step('sign and package packages', [
      'apt update',
      'apt install zip',
      'yarn sign',
      'ls -1 ./dist',
      'git status',
      'zip -r grafana-pyroscope-app-${DRONE_BUILD_NUMBER}.zip ./dist',
    ], image=dockerNodeImage) + {
      environment: {
        GRAFANA_API_KEY: {
          from_secret: 'GRAFANA_API_KEY',
        },
      },
      depends_on: [
        'build frontend packages',
        'build frontend packages (with tag)',
      ],
    } + mainOrReleaseOnly,

    step('publish zip to GCS', [], image='plugins/gcs') + {
      depends_on: [
        'sign and package packages',
      ],
      settings: {
        acl: 'allUsers:READER',
        source: 'grafana-pyroscope-app-${DRONE_BUILD_NUMBER}.zip',
        target: 'grafana-pyroscope-app/releases/grafana-pyroscope-app-${DRONE_BUILD_NUMBER}.zip',
        token: {
          from_secret: 'gcs_service_account_key',
        },
      },
    } + releaseOnly,

    step('publish zip to GCS with commit SHA', [], image='plugins/gcs') + {
      depends_on: [
        'sign and package packages',
      ],
      settings: {
        acl: 'allUsers:READER',
        source: 'grafana-pyroscope-app-${DRONE_BUILD_NUMBER}.zip',
        target: 'grafana-pyroscope-app/releases/grafana-pyroscope-app-${DRONE_COMMIT}.zip',
        token: {
          from_secret: 'gcs_service_account_key',
        },
      },
    } + releaseOnly,

    step('publish zip to GCS with latest-dev', [], image='plugins/gcs') + {
      depends_on: [
        'sign and package packages',
      ],
      settings: {
        acl: 'allUsers:READER',
        source: 'grafana-pyroscope-app-${DRONE_BUILD_NUMBER}.zip',
        target: 'grafana-pyroscope-app/releases/grafana-pyroscope-app-edge.zip',
        token: {
          from_secret: 'gcs_service_account_key',
        },
      },
    } + mainOnly,

    step('publish zip to GCS with dev-tag', [], image='plugins/gcs') + {
      depends_on: [
        'sign and package packages',
      ],
      settings: {
        acl: 'allUsers:READER',
        source: 'grafana-pyroscope-app-${DRONE_BUILD_NUMBER}.zip',
        target: 'grafana-pyroscope-app/releases/grafana-pyroscope-app-${DRONE_COMMIT}.zip',
        token: {
          from_secret: 'gcs_service_account_key',
        },
      },
    } + mainOnly,

    step('publish zip to GCS with latest', [], image='plugins/gcs') + {
      depends_on: [
        'sign and package packages',
      ],
      settings: {
        acl: 'allUsers:READER',
        source: 'grafana-pyroscope-app-${DRONE_BUILD_NUMBER}.zip',
        target: 'grafana-pyroscope-app/releases/grafana-pyroscope-app-latest.zip',
        token: {
          from_secret: 'gcs_service_account_key',
        },
      },
    } + releaseOnly,

    step('publish zip to GCS with tag', [], image='plugins/gcs') + {
      depends_on: [
        'sign and package packages',
        'generate tags',
      ],
      settings: {
        acl: 'allUsers:READER',
        source: 'grafana-pyroscope-app-${DRONE_BUILD_NUMBER}.zip',
        target: 'grafana-pyroscope-app/releases/grafana-pyroscope-app-${DRONE_TAG}.zip',
        token: {
          from_secret: 'gcs_service_account_key',
        },
      },
    } + releaseOnly,

    step('publish release to Github', [], image='plugins/github-release') + {
      settings: {
        api_key: {
          from_secret: 'gh_token',
        },
        files: 'grafana-pyroscope-app-${DRONE_BUILD_NUMBER}.zip',
        title: '${DRONE_TAG}',  // v1.2.3
      },
      depends_on: [
        'generate tags',
        'sign and package packages',
      ],
    } + releaseOnly,
  ]),

  pipeline('deploy dev', [
    generateTagsStep(),
    deployStep('dev'),
  ]) + {
    image_pull_secrets: ['gcr_reader'],
    depends_on: [
      'build packages',
    ],
    trigger+: {
      ref: [
        'refs/heads/main',
      ],
    },
  },

  pipeline('weekly deploy ops', [
    generateTagsStep(),
    deployStep('ops'),
  ]) + { depends_on: [
    'build packages',
  ],
    image_pull_secrets: ['gcr_reader'],
    trigger+: { ref: ['refs/tags/weekly-f*'] },
  },

  pipeline('weekly deploy prod', [
    generateTagsStep(),
    deployStep('prod'),
  ]) + { depends_on: [
    'build packages',
  ],
    image_pull_secrets: ['gcr_reader'],
    trigger+: { ref: ['refs/tags/weekly-f*'] },
  },

  pipeline('deploy ops', [
    generateTagsStep(),
    deployStep('ops'),
  ]) + { depends_on: [
    'build packages',
  ] } + promoteOnly('ops') + {
    image_pull_secrets: ['gcr_reader'],
    trigger+: { ref: ['refs/tags/*'] },
  },

  pipeline('deploy prod', [
    generateTagsStep(),
    deployStep('prod'),
  ]) + { depends_on: [
    'build packages',
  ] } + promoteOnly('prod') + {
    image_pull_secrets: ['gcr_reader'],
    trigger+: { ref: ['refs/tags/*'] },
  },

  vault_secret('dockerconfigjson', 'infra/data/ci/gcr-admin', '.dockerconfigjson'),
  vault_secret('gcr_reader', 'secret/data/common/gcr', '.dockerconfigjson'),
  vault_secret('gcs_service_account_key', 'infra/data/ci/drone-plugins', 'gcp_key'),
  vault_secret('gh_token', 'infra/data/ci/github/grafanabot', 'pat'),
  vault_secret('slack_webhook', 'infra/data/ci/slack_webhooks', 'slack-plugin'),
  vault_secret('argo_token', 'infra/data/ci/argo-workflows/trigger-service-account', 'token'),
]

