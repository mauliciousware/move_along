import type { TrackingStatus } from '@/lib/shared/pushup-types';
export function StepBackOverlay({ status }: { status: TrackingStatus }) {
  if (status === 'TRACKING') return null;
  return <div className="step-back" role="status"><strong>STEP BACK — I CAN&apos;T SEE YOU</strong><span>Keep your head and shoulders in frame.</span>{status === 'LOST_LONG' && <span>Tracking paused. Hold still when you return.</span>}</div>;
}
