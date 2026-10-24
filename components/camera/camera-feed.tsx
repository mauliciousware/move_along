"use client";
import type { RefObject } from "react";
import type { CameraFacing } from "@/lib/shared/types";
export function CameraFeed({ videoRef, facing, active }: { active: boolean; videoRef: RefObject<HTMLVideoElement | null>; facing: CameraFacing }) {
  return <video ref={videoRef} className="live-camera-feed" data-mirrored={facing === "user"} muted playsInline autoPlay disablePictureInPicture aria-hidden={!active} aria-label={`${facing === "user" ? "Mirrored front" : "Rear"} camera, processed only on this device`} />;
}
