'use client';
import dynamic from 'next/dynamic';
export const CameraSurface = dynamic(() => import('./PoseView'), { ssr: false, loading: () => <p role="status">Loading camera preview…</p> });
