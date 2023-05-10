import { Result } from '@webapp/util/fp';
import { Profile, Groups, FlamebearerProfileSchema } from '@pyroscope/models/src';
import { z, type ZodError } from 'zod';
import { buildRenderURL } from '@webapp/util/updateRequests';
import { Timeline, TimelineSchema } from '@webapp/models/timeline';
import { Annotation, AnnotationSchema } from '@webapp/models/annotation';
import { request, type RequestError } from '@webapp/services/base';

export interface RenderOutput {
  profile: Profile;
  timeline: Timeline;
  groups?: Groups;
  annotations: Annotation[];
}

// Default to empty array if not present
const defaultAnnotationsSchema = z.preprocess((a) => {
  if (!a) {
    return [];
  }
  return a;
}, z.array(AnnotationSchema));

interface RenderSingleProps {
  from: string;
  until: string;
  query: string;
  refreshToken?: string;
  maxNodes: string | number;
}
export async function renderSingle(
  props: RenderSingleProps,
  controller?: {
    signal?: AbortSignal;
  }
): Promise<Result<RenderOutput, RequestError | ZodError>> {
  const url = buildRenderURL(props);

  const response = await request(`pyroscope${url}&format=json`, {
    signal: controller?.signal,
  });

  if (response.isErr) {
    return Result.err<RenderOutput, RequestError>(response.error);
  }

  const parsed = FlamebearerProfileSchema.merge(
    z.object({
      timeline: TimelineSchema,
      annotations: defaultAnnotationsSchema,
    })
  )
    .merge(z.object({ telemetry: z.object({}).passthrough().optional() }))
    .safeParse(response.value);

  if (parsed.success) {
    // TODO: strip timeline
    const profile = parsed.data;
    const { timeline, annotations } = parsed.data;

    return Result.ok({
      profile,
      timeline,
      annotations,
    });
  }

  return Result.err(parsed.error);
}

export type RenderDiffResponse = z.infer<typeof FlamebearerProfileSchema>;

interface RenderDiffProps {
  leftFrom: string;
  leftUntil: string;
  leftQuery: string;
  refreshToken?: string;
  maxNodes: string;
  rightQuery: string;
  rightFrom: string;
  rightUntil: string;
}

export async function renderDiff(
  props: RenderDiffProps,
  controller?: {
    signal?: AbortSignal;
  }
) {
  return Result.err<z.infer<typeof FlamebearerProfileSchema>, { message: string }>({
    message: 'TODO: implement ',
  });
}

export interface RenderExploreOutput {
  profile: Profile;
  groups: Groups;
}
export async function renderExplore(
  props: unknown,
  controller?: {
    signal?: AbortSignal;
  }
) {
  return Result.err<RenderExploreOutput, { message: string }>({
    message: 'TODO: implement ',
  });
}
