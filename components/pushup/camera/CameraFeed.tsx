'use client';
import { useEffect, useRef } from 'react';
import type { PoseEngine } from '@/lib/pushup/engine';
export function CameraFeed({ engine, videoRef }: { engine: PoseEngine; videoRef: React.RefObject<HTMLVideoElement | null> }) {
  const ownRef = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    const video = ownRef.current;
    if (!video) return;
    videoRef.current = video;
    void engine.attach(video);
    return () => { videoRef.current = null; engine.detach(); };
  }, [engine, videoRef]);
  return <video ref={ownRef} className="camera-feed" muted playsInline autoPlay aria-label="Mirrored local camera preview" />;
}
