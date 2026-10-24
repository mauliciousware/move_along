"use client";
import dynamic from "next/dynamic";
const CameraSurface = dynamic(() => import("./camera-setup"), {
  ssr: false,
  loading: () => <div className="camera-module-loading" role="status">Preparing camera setup…</div>,
});
export default CameraSurface;
