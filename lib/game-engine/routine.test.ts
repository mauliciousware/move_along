import { expect, it } from 'vitest';
import { aggregateRoutine, continueRoutine, finishBlock, initialRoutine, type BlockResult } from './routine';
import { newStats, accuracy } from './scoring';
import { analyzeSession } from './analysis';
const result=(exercise:BlockResult['exercise'],outcome:BlockResult['outcome']='complete'):BlockResult=>({exercise,outcome,stats:{...newStats(),pushups:10,perfect:2,miss:1},analysis:analyzeSession([],newStats(),0,0,true)});
it('enforces real rest, permits skip, and ends the entire routine on STOP',()=>{
 const rest=finishBlock(initialRoutine,result('squat'),3,1000);
 expect(rest.phase).toBe('rest');expect(continueRoutine(rest,15999)).toBe(rest);
 const next=continueRoutine(rest,16000);expect(next.index).toBe(1);
 const skipped=finishBlock(next,result('march','skipped'),3,17000);
 const floor=continueRoutine(skipped,32000);expect(floor.index).toBe(2);
 expect(finishBlock(floor,result('pushup'),3,33000).phase).toBe('results');
 expect(finishBlock(initialRoutine,result('squat','stopped'),3,1000).phase).toBe('results');
 expect(finishBlock(rest,result('squat'),3,1001)).toBe(rest);
});
it('aggregates judged cues and keeps steps separate from exercise reps',()=>{
 const total=aggregateRoutine([result('pushup'),result('march')]);
 expect(total.counts).toEqual({pushup:10,squat:0,march:10});
 expect(total.stats.pushups).toBe(0);expect(accuracy(total.stats)).toBeCloseTo(2/3);
});
