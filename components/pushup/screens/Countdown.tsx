export function Countdown({count,reentry=false}:{count:string;reentry?:boolean}) {
  return <div className="game-message countdown" role="status"><p className="muted">{reentry?'Find your position. Coming back in…':'Find your position. Get ready.'}</p><h1>{count}</h1><p className="lead">Fill the target. Meet the beat.</p></div>;
}
