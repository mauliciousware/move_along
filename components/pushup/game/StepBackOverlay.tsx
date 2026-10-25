import type { TrackingStatus } from '@/lib/shared/pushup-types';
import type { FramingIssue } from '@/lib/shared/types';
import { FRAMING_COPY } from '@/lib/pose-engine/framing';
export function StepBackOverlay({ status, issue = 'person' }: { status: TrackingStatus; issue?: FramingIssue }) {
  if (status === 'TRACKING') return null;
  const copy = FRAMING_COPY[issue];
  return <div className="step-back" role="status"><strong>{copy.title}</strong><span>{copy.detail}</span>{status === 'LOST_LONG' && <span>Tracking paused. Hold still when you return.</span>}</div>;
}
