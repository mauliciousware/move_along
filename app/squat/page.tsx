'use client';
import dynamic from 'next/dynamic';
const Workout = dynamic(()=>import('@/components/pushup/workout'),{ssr:false,loading:()=> <main className="narrow-panel"><p>Loading your squat game…</p></main>});
export default function SquatPage(){ return <Workout exercise="squat"/>; }
