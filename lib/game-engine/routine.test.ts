import { expect, it } from 'vitest';
import { aggregateRoutine, continueRoutine, finishBlock, initialRoutine, type BlockResult } from './routine';
import { newStats, accuracy } from './scoring';
import { analyzeSession } from './analysis';
const result=(exercise:BlockResult['exercise'],outcome:BlockResult['outcome']='complete'):BlockResult=>({exercise,outcome,stats:{...newStats(),reps:10,perfect:2,miss:1},analysis:analyzeSession([],newStats(),0,0,true)});
it('enforces real rest, permits skip, and ends the entire routine on STOP',()=>{
 const rest=finishBlock(initialRoutine,result('pushup'),2,1000);
 expect(rest.phase).toBe('rest');expect(continueRoutine(rest,15999)).toBe(rest);
 const next=continueRoutine(rest,16000);expect(next.index).toBe(1);
 expect(finishBlock(next,result('squat','skipped'),2,17000).phase).toBe('results');
 expect(finishBlock(initialRoutine,result('pushup','stopped'),2,1000).phase).toBe('results');
 expect(finishBlock(rest,result('squat'),2,1001)).toBe(rest);
});
it('aggregates judged cues and keeps each exercise rep count in its own counter',()=>{
 const total=aggregateRoutine([result('pushup'),result('squat')]);
 expect(total.counts).toEqual({pushup:10,squat:10});
 expect(total.stats.reps).toBe(0);expect(accuracy(total.stats)).toBeCloseTo(2/3);
});
