'use client';
import dynamic from 'next/dynamic';
const Workout = dynamic(()=>import('@/components/pushup/workout'),{ssr:false,loading:()=> <main className="narrow-panel"><p>Loading your sit-up game…</p></main>});
export default function SitupPage(){ return <Workout exercise="situp"/>; }
