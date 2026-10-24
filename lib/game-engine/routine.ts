import { CONFIG } from '../shared/config';
import type { ExerciseId } from '../shared/types';
import { newStats, type Stats } from './scoring';
import type { SessionAnalysis } from './analysis';
export interface BlockResult {
 exercise: ExerciseId;
 stats: Stats;
 analysis: SessionAnalysis;
 outcome: 'complete' | 'skipped' | 'stopped';
}
export interface RoutineState { phase: 'workout'|'rest'|'results'; index: number; results: BlockResult[]; restUntil: number }
export const initialRoutine: RoutineState = {phase:'workout',index:0,results:[],restUntil:0};
export function finishBlock(state:RoutineState,result:BlockResult,total:number,now:number):RoutineState {
 if(state.phase!=='workout')return state;
 const results=[...state.results,result];
 return {...state,results,phase:result.outcome==='stopped'||state.index+1>=total?'results':'rest',restUntil:now+CONFIG.routine.restSeconds*1000};
}
export function continueRoutine(state:RoutineState,now:number):RoutineState {
 return state.phase==='rest'&&now>=state.restUntil ? {...state,phase:'workout',index:state.index+1}:state;
}
export function aggregateRoutine(results:BlockResult[]) {
 const stats=newStats();const counts:Record<ExerciseId,number>={pushup:0,situp:0};
 for(const result of results){
  counts[result.exercise]+=result.stats.pushups;
  for(const key of ['score','perfect','good','ok','miss','skipped','plankTimeMs','workoutTimeMs'] as const)stats[key]+=result.stats[key];
  stats.maxCombo=Math.max(stats.maxCombo,result.stats.maxCombo);
 }
 return {stats,counts};
}
