import { TimeRange } from '@grafana/data';
import Color from 'color';
import { ReactNode } from 'react';

interface Timeline {
  startTime: number;
  samples: number[];
  durationDelta: number;
}

interface Annotation {
  content: string;
  timestamp: number;
}

interface Group {
  watermark?: Record<string, any>;
  // timeline data
  startTime: number;
  samples: number[];
  durationDelta: number;
}

interface TooltipCallbackProps {
  timeLabel: string;
  values: Array<{
    closest: number[];
    color: number[];
    // TODO: remove this
    tagName: string;
  }>;
  coordsToCanvasPos?: any;
  canvasX?: number;
}

interface ContextMenuProps {
  click: {
    /** The X position in the window where the click originated */
    pageX: number;
    /** The Y position in the window where the click originated */
    pageY: number;
  };
  timestamp: number;
  containerEl: HTMLElement;
}

interface TimelineGroupData {
  data: Group;
  tagName: string;
  color?: Color;
}

interface TimelineData {
  data?: Timeline;
  color?: Color;
}

interface Selection {
  from: string;
  to: string;
  color: Color;
  overlayColor: Color;
}

type SingleDataProps = {
  /** used to display at max 2 time series */
  mode: 'singles';
  /** timelineA refers to the first (and maybe unique) timeline */
  timelineA: TimelineData;
  /** timelineB refers to the second timeline, useful for comparison view */
  timelineB?: TimelineData;
};

// Used in Tag Explorer
type MultipleDataProps = {
  /** used when displaying multiple time series. original use case is for tag explorer */
  mode: 'multiple';
  /** timelineGroups refers to group of timelines, useful for explore view */
  timelineGroups: TimelineGroupData[];
  /** if there is active group, the other groups should "dim" themselves */
  activeGroup: string;
  /** show or hide legend */
  showTagsLegend: boolean;
  /** to set active tagValue using <Legend /> */
  handleGroupByTagValueChange: (groupByTagValue: string) => void;
};

type TimelineDataProps = SingleDataProps | MultipleDataProps;

export type TimelineChartWrapperProps = TimelineDataProps & {
  /** the id attribute of the element float will use to apply to, it should be globally unique */
  id: string;

  ['data-testid']?: string;
  onSelect: (from: string, to: string) => void;
  format: 'lines' | 'bars';

  height?: string;

  /** refers to the highlighted selection */
  selection?: {
    left?: Selection;
    right?: Selection;
  };

  timezone: 'browser' | 'utc';
  title?: ReactNode;

  /** whether to show a selection with grabbable handle
   * ATTENTION: it only works with a single selection */
  selectionWithHandler?: boolean;

  /** selection type 'single' => gray selection, 'double' => color selection */
  selectionType: 'single' | 'double';
  onHoverDisplayTooltip?: React.FC<TooltipCallbackProps>;

  /** list of annotations timestamp, to be rendered as markings */
  annotations?: Annotation[];

  /** What element to render when clicking */
  ContextMenu?: (props: ContextMenuProps) => React.ReactNode;

  /** The list of timeline IDs (flotjs component) to sync the crosshair with */
  syncCrosshairsWith?: string[];

  timeRange: TimeRange;
  onSelectTimeRange: (newTimeRange: TimeRange) => void;

  showLegend?: boolean;
};
