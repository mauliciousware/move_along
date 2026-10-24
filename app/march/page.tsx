"use client";
import dynamic from 'next/dynamic';
const Workout=dynamic(()=>import('@/components/pushup/workout'),{ssr:false,loading:()=> <main className="narrow-panel"><p>Loading your movement game…</p></main>});
export default function Page(){return <Workout exercise="march"/>;}
