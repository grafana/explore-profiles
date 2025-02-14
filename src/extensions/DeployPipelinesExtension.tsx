export interface DeployPipeline {
  block: string;
  name: string;
}

export interface DeployLabels {
  deploy?: string;
  update?: string;
  upToDate?: string;
  success?: string;
}

export interface DeployPipelinesExtensionProps {
  pipelines: DeployPipeline[];
  labels?: DeployLabels;
}
