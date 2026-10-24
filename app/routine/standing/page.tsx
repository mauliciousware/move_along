'use client';
import dynamic from 'next/dynamic';
const Routine=dynamic(()=>import('@/components/routines/workout'),{ssr:false});
export default function Page(){return <Routine id="standing"/>;}
