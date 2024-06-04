export type QueryAnalysisResult = {
  queryImpact: {
    type: string;
    totalBytesInTimeRange: number;
    totalQueriedSeries: number;
    deduplicationNeeded: boolean;
  };
  queryScopes: QueryAnalysisScope[];
};

type QueryAnalysisScope = {
  componentType: string;
  componentCount: number;
  blockCount: number;
  seriesCount: number;
  profileCount: number;
  sampleCount: number;
  indexBytes: number;
  profileBytes: number;
  symbolBytes: number;
};
