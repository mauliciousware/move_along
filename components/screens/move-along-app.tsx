"use client";

import { useEffect, useReducer, useRef, useState } from "react";
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, Camera, Check, ChevronRight, Footprints, LockKeyhole, Pause, Play, RotateCcw, ShieldCheck, Square, Timer, X } from "lucide-react";
import { Button } from "@/components/ui/8bit/button";
import { Badge } from "@/components/ui/8bit/badge";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/8bit/card";
import { Progress } from "@/components/ui/8bit/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { MovementArt, PixelSpark } from "@/components/illustrations/movement-art";
import { EXERCISES, EXERCISE_IDS, ROUTINES, ROUTINE_IDS } from "@/data/catalog";
import { APP_NAME, CONFIG } from "@/lib/shared/config";
import { ACTIVE_SCREENS, currentExercise, exerciseIds, flowReducer, INITIAL_FLOW } from "@/lib/shared/flow";
import type { Screen } from "@/lib/shared/types";
import { cn } from "@/lib/utils";

const PAGE_TITLES: Record<Screen, string> = {
  landing: "Move Along", safety: "Before we move", routines: "Find your kind of movement.",
  preview: "Your little game plan.", library: "Meet your moves.", how: "Your body. Your controller.",
  learn: "Learn the movement.", camera: "Make a little room.", calibration: "Make it your movement.",
  practice: "Try it at your pace.", countdown: "A moment to get ready.", gameplay: "Meet the beat.",
  rest: "Take a little breather.", results: "A little movement goes a long way.",
};

export function MoveAlongApp() {
  const [state, dispatch] = useReducer(flowReducer, INITIAL_FLOW);
  const [pauseOpen, setPauseOpen] = useState(false);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const previousScreen = useRef<Screen>("landing");
  const exercise = EXERCISES[currentExercise(state)];
  const routine = ROUTINES[state.routine];
  const active = ACTIVE_SCREENS.includes(state.screen);
  const ids = exerciseIds(state);
  const go = (screen: Screen) => dispatch({ type: "navigate", screen });
  const next = () => dispatch({ type: "next" });
  const stop = () => { setPauseOpen(false); dispatch({ type: "stop" }); };

  useEffect(() => {
    if (previousScreen.current !== state.screen) {
      headingRef.current?.focus();
      window.scrollTo({ top: 0, behavior: "instant" });
      previousScreen.current = state.screen;
    }
  }, [state.screen]);

  function begin() {
    try {
      if (sessionStorage.getItem(CONFIG.sessionKeys.safety) === "yes") go("routines");
      else dispatch({ type: "requireSafety", then: "routines" });
    } catch { dispatch({ type: "requireSafety", then: "routines" }); }
  }
  function startSetup() {
    try {
      if (sessionStorage.getItem(CONFIG.sessionKeys.safety) === "yes") next();
      else dispatch({ type: "requireSafety", then: "camera" });
    } catch { dispatch({ type: "requireSafety", then: "camera" }); }
  }
  function acceptSafety() {
    try { sessionStorage.setItem(CONFIG.sessionKeys.safety, "yes"); } catch { /* In-memory navigation still works when storage is unavailable. */ }
    next();
  }

  return <div className="app-shell">
    <a className="skip-link" href="#main-content">Skip to content</a>
    <header className="site-header">
      <button type="button" className="brand" onClick={() => go("landing")} aria-label={`${APP_NAME} home`}>
        <span className="brand-mark"><PixelSpark /></span><span>move along<span className="brand-dot">.</span></span>
      </button>
      {active ? <div className="header-actions">
        <Button variant="ghost" font="normal" size="sm" onClick={() => setPauseOpen(true)} aria-label="Pause preview"><Pause data-icon="inline-start" /><span className="optional-label">Pause</span></Button>
        <Button variant="destructive" font="normal" size="sm" onClick={stop}><Square data-icon="inline-start" />Stop</Button>
      </div> : <nav aria-label="Main navigation" className="main-nav">
        <Button variant="ghost" font="normal" size="sm" onClick={() => go("library")} aria-current={state.screen === "library" ? "page" : undefined}>The moves</Button>
        <Button variant="ghost" font="normal" size="sm" onClick={() => go("how")} aria-current={state.screen === "how" ? "page" : undefined}>How to play</Button>
      </nav>}
    </header>

    <main id="main-content" className={cn("main-content", state.screen === "landing" && "landing-content")}>
      {state.screen === "landing" ? <>
        <section className="hero" aria-labelledby="hero-title">
          <div className="hero-copy">
            <Badge variant="secondary" font="normal"><PixelSpark className="badge-spark" />A little break from the scroll</Badge>
            <h1 id="hero-title" ref={headingRef} tabIndex={-1}>A little<br />movement.<br />A lot more<br />play.</h1>
            <p>Turn your everyday moves into a game.<br className="desktop-break" /> Learn, find your rhythm, and move along.</p>
            <div className="hero-actions"><Button onClick={begin} font="normal" size="lg"><Play data-icon="inline-start" />Let’s move</Button><Button variant="ghost" font="normal" onClick={() => go("how")}>Show me how<ChevronRight data-icon="inline-end" /></Button></div>
            <div className="privacy-note"><LockKeyhole aria-hidden="true" />Just you, your camera, and a little room.</div>
          </div>
          <div className="hero-scene" role="img" aria-label="Original pixel characters squatting, marching and doing a push-up on a lilac stage">
            <div className="scene-topline"><span>Everybody has a rhythm.</span><PixelSpark /></div>
            <div className="scene-window">
              <span className="pixel-cloud cloud-one" /><span className="pixel-cloud cloud-two" />
              <PixelSpark className="scene-star star-one" /><PixelSpark className="scene-star star-two" />
              <div className="scene-caption retro">Find yours.</div>
              <div className="character character-left"><MovementArt exercise="march" decorative /><span>step</span></div>
              <div className="character character-center"><MovementArt exercise="squat" decorative /><span>down + up</span></div>
              <div className="character character-right"><MovementArt exercise="pushup" decorative /><span>push</span></div>
              <div className="scene-ground" />
            </div>
            <div className="scene-bottom"><span><span className="status-square" />Your body is the controller</span><span>↑ ↓</span></div>
          </div>
        </section>
        <section className="quick-start" aria-labelledby="quick-title"><div><h2 id="quick-title">A small start is a good start.</h2><p>No equipment. No big commitment. Pick what feels right today.</p></div><Button variant="outline" font="normal" onClick={begin}>Find my routine<ArrowRight data-icon="inline-end" /></Button></section>
        <div className="movement-strip" aria-label="Available movements">{EXERCISE_IDS.map(id => <button key={id} type="button" onClick={() => dispatch({ type: "selectExercise", exercise: id })}><span className={cn("move-dot", `tone-${id}`)} />{EXERCISES[id].name}<ChevronRight aria-hidden="true" /></button>)}</div>
      </> : <>
        <div className="page-topline"><Button variant="ghost" font="normal" size="sm" onClick={() => go(active ? "routines" : "landing")}><ArrowLeft data-icon="inline-start" />{active ? "Routines" : "Home"}</Button><Badge variant="outline" font="normal">Interface preview</Badge></div>
        <div className="page-heading"><p>{active ? `${routine.name} / ${exercise.name}` : "Move a little. Feel the rhythm."}</p><h1 ref={headingRef} tabIndex={-1}>{PAGE_TITLES[state.screen]}</h1></div>
        {state.screen === "safety" && <section className="narrow-panel safety-panel"><ShieldCheck className="section-icon" aria-hidden="true" /><p className="lead">Go at your own pace. Rest anytime.</p><p>Stop exercising if you feel pain or dizziness. This is a movement game, not medical advice or a form assessment.</p><p>You can skip any movement or end your session whenever you like.</p><Button font="normal" onClick={acceptSafety}>I understand<ArrowRight data-icon="inline-end" /></Button></section>}

        {state.screen === "routines" && <>
          <p className="section-intro">A standing reset, a little of everything, or just your favorite move. You choose.</p>
          <div className="routine-grid">{ROUTINE_IDS.map((id, i) => {
            const item = ROUTINES[id];
            return <Card key={id} font="normal" className="routine-card"><CardHeader font="normal"><div className={cn("routine-art", `routine-art-${id}`)}><MovementArt exercise={id === "mix" ? "pushup" : id === "single" ? "march" : "squat"} decorative /><span className="routine-number retro">{String(i + 1).padStart(2, "0")}</span></div><CardTitle font="normal">{item.name}</CardTitle><CardDescription font="normal">{item.description}</CardDescription></CardHeader><CardContent font="normal"><div className="routine-meta"><Footprints aria-hidden="true" />{item.setup}</div><div className="routine-meta"><Timer aria-hidden="true" />{id === "single" ? "1 movement" : `${item.exercises.length} movements`} · your pace</div></CardContent><CardFooter font="normal"><Button font="normal" variant={id === "standing" ? "default" : "outline"} className="w-full" onClick={() => dispatch({ type: "selectRoutine", routine: id })}>Choose this<ArrowRight data-icon="inline-end" /></Button></CardFooter></Card>;
          })}</div>
        </>}

        {state.screen === "preview" && <div className="detail-grid"><div className="routine-overview"><h2>{routine.name}</h2><p>{routine.description}</p>{state.routine === "single" && <p>Choose a movement from the library to start a single-exercise session.</p>}<ol className="sequence-list">{ids.map((id, i) => <li key={id}><span className="sequence-index">{i + 1}</span><div><strong>{EXERCISES[id].name}</strong><span>{CONFIG.routine.workSeconds} seconds of play{ i < ids.length - 1 ? ` · ${CONFIG.routine.restSeconds} seconds of rest after` : ""}</span></div></li>)}</ol><p className="muted-copy">Learning, camera setup and practice take as long as you need.{state.routine === "mix" && " You’ll move your phone once for the floor section."}</p><div className="button-row"><Button font="normal" onClick={next}>Learn the first move<ArrowRight data-icon="inline-end" /></Button>{state.routine === "single" && <Button variant="outline" font="normal" onClick={() => go("library")}>Change movement</Button>}</div></div><div className="detail-art"><MovementArt exercise={exercise.id} /><Badge variant="secondary" font="normal">{routine.setup}</Badge></div></div>}

        {state.screen === "library" && <><p className="section-intro">Get to know each movement before you play. Your camera can stay off.</p><div className="exercise-list">{EXERCISE_IDS.map(id => <article className="exercise-row" key={id}><div className={cn("library-art", `tone-${id}`)}><MovementArt exercise={id} decorative /></div><div><h2>{EXERCISES[id].name}</h2><p>{EXERCISES[id].summary}</p></div><Button variant="outline" font="normal" onClick={() => dispatch({ type: "selectExercise", exercise: id })}>Learn this<ChevronRight data-icon="inline-end" /></Button></article>)}</div></>}

        {state.screen === "how" && <><div className="how-grid">{[{ icon: Footprints, title: "Pick your moves", text: "Choose a standing routine, a full-body mix, or one movement to explore." }, { icon: Camera, title: "Find your space", text: "Set up your camera, learn the movement, and calibrate a comfortable range." }, { icon: Play, title: "Meet the beat", text: "Move toward the targets. Timing earns points. Rest and stop whenever you need." }].map(({ icon: Icon, title, text }, i) => <article className="how-step" key={title}><span className="step-counter retro">0{i + 1}</span><Icon aria-hidden="true" /><h2>{title}</h2><p>{text}</p></article>)}</div><Alert><LockKeyhole /><AlertTitle>Designed to stay on your device</AlertTitle><AlertDescription>Camera processing will run locally. No recording, uploads, accounts, or saved scores.</AlertDescription></Alert><div className="center-action"><Button font="normal" onClick={begin}>Find my routine<ArrowRight data-icon="inline-end" /></Button></div></>}

        {state.screen === "learn" && <div className="detail-grid"><div className="detail-art learn-art"><MovementArt exercise={exercise.id} /><span className="art-caption">Movement illustration</span></div><div className="learn-copy"><Badge variant="secondary" font="normal">{exercise.name}</Badge><h2>{exercise.verb}</h2><p>{exercise.joints}</p><p className="muted-copy">{exercise.everyday}</p><Separator /><ol className="instruction-list">{exercise.instructions.map(line => <li key={line}>{line}</li>)}</ol><p className="control-note">{exercise.controls}</p><Button font="normal" onClick={startSetup}>Show camera setup<Camera data-icon="inline-end" /></Button></div></div>}

        {state.screen === "camera" && <div className="detail-grid"><div className="camera-placeholder"><div className="viewfinder-corner top-left" /><div className="viewfinder-corner bottom-right" /><Camera aria-hidden="true" /><strong>Camera setup preview</strong><p>Your camera is off.</p><MovementArt exercise={exercise.id} decorative /></div><div className="setup-copy"><h2>A clear view of your movement.</h2><p>{exercise.placement}</p><ul><li>Choose a clear, well-lit space.</li><li>Keep your phone stable.</li><li>Leave room to move comfortably.</li></ul><Alert><Camera /><AlertTitle>Camera connection comes next</AlertTitle><AlertDescription>This first build previews the screen flow. It does not request camera access or track movement yet.</AlertDescription></Alert><Button font="normal" onClick={next}>Preview calibration<ArrowRight data-icon="inline-end" /></Button></div></div>}

        {state.screen === "calibration" && <div className="detail-grid"><div className="detail-art"><MovementArt exercise={exercise.id} /><span className="art-caption">Illustration, not live tracking</span></div><div className="setup-copy"><Badge variant="secondary" font="normal">Step {state.calibrationStep + 1} of {CONFIG.preview.calibrationSteps}</Badge><h2>{["Find your starting position.", "Explore a comfortable range.", "Return to your starting position."][state.calibrationStep]}</h2><p>Calibration will learn the movement range you choose, so the game can place your targets.</p><Progress variant="retro" value={state.calibrationStep / CONFIG.preview.calibrationSteps * 100} aria-label="Calibration screen preview progress" /><p className="muted-copy">Preview only. No body measurements are being collected.</p><Button font="normal" onClick={next}>{state.calibrationStep < CONFIG.preview.calibrationSteps - 1 ? "Preview next step" : "Preview practice"}<ArrowRight data-icon="inline-end" /></Button></div></div>}

        {state.screen === "practice" && <section className="narrow-panel"><MovementArt exercise={exercise.id} /><h2>No timer. No pressure.</h2><p>{exercise.controls}</p><p className="muted-copy">In the playable build, two untimed movements will help you get to know your targets. This is the practice screen preview.</p><Button font="normal" onClick={next}>Preview countdown<ArrowRight data-icon="inline-end" /></Button></section>}

        {state.screen === "countdown" && <section className="narrow-panel countdown-panel"><span className="countdown-number retro" aria-live="polite">{state.countdown}</span><p>The game will start after a short countdown.</p><p className="muted-copy">This preview advances when you press the button.</p><Button font="normal" onClick={next}>{state.countdown > 1 ? "Next count" : "Preview game layout"}<ArrowRight data-icon="inline-end" /></Button></section>}

        {state.screen === "gameplay" && <div className="game-layout"><div className="game-stage"><div className="game-stage-label"><Badge variant="outline" font="normal">Game layout preview</Badge><span>{exercise.name}</span></div><div className="target-example target-up">{exercise.id === "march" ? <ArrowLeft /> : <ArrowUp />}<span>{exercise.id === "march" ? "LEFT" : "UP"}</span></div><MovementArt exercise={exercise.id} decorative /><div className="target-example target-down">{exercise.id === "march" ? <ArrowRight /> : <ArrowDown />}<span>{exercise.id === "march" ? "RIGHT" : "DOWN"}</span></div><p>Movement fill + beat timing will appear here.</p></div><div className="setup-copy"><h2>Your movement meets the music.</h2><p>One target at a time. Reach it on the beat to earn a rhythm hit.</p><p className="muted-copy">Camera, audio, scoring and movement detection are not active in this layout preview.</p><div className="preview-stats"><div><span>Detected movements</span><strong>—</strong></div><div><span>Rhythm accuracy</span><strong>—</strong></div></div><Button font="normal" onClick={next}>Preview end of block<ArrowRight data-icon="inline-end" /></Button><Button variant="outline" font="normal" onClick={() => setPauseOpen(true)}><Pause data-icon="inline-start" />Open pause menu</Button></div></div>}

        {state.screen === "rest" && <section className="narrow-panel rest-panel"><PixelSpark className="rest-spark" /><Badge variant="secondary" font="normal">Between movements</Badge><h2>A pause is part of the plan.</h2><p>Next up: <strong>{EXERCISES[ids[state.block + 1]].name}</strong>.</p><p>{ids[state.block + 1] === "pushup" ? "You’ll switch to the floor camera setup next. Take your time." : "Keep your phone in place. We’ll check the next movement before starting."}</p><p className="muted-copy">The playable build includes at least {CONFIG.routine.restSeconds} seconds of rest. No timer runs in this preview.</p><Button font="normal" onClick={next}>Preview next movement<ArrowRight data-icon="inline-end" /></Button></section>}

        {state.screen === "results" && <section className="narrow-panel results-panel"><span className="completion-icon"><Check /></span><Badge variant="secondary" font="normal">{state.endedEarly ? "Preview ended early" : "Preview complete"}</Badge><h2>You’ve seen the game plan.</h2><p>{state.endedEarly ? "You can always stop or return to a different routine." : "Learn, calibrate, practice, play, and rest. A little movement at your pace."}</p><Alert><AlertTitle>No movement recorded</AlertTitle><AlertDescription>This was an interface preview. Session counts, rhythm accuracy and time will appear here once gameplay is connected.</AlertDescription></Alert><Button font="normal" onClick={next}>Explore another routine<RotateCcw data-icon="inline-end" /></Button><Button variant="ghost" font="normal" onClick={() => go("landing")}>Done for now</Button></section>}
      </>}
    </main>

    <footer className="site-footer"><span><PixelSpark />A little movement, at your pace.</span><span>First look · camera & gameplay coming next</span></footer>

    <Dialog open={pauseOpen} onOpenChange={setPauseOpen}><DialogContent className="pause-dialog" showCloseButton={false}><DialogHeader><div className="dialog-top"><DialogTitle>Take your time.</DialogTitle><Button variant="ghost" font="normal" size="sm" onClick={() => setPauseOpen(false)} aria-label="Close pause menu"><X /></Button></div><DialogDescription>This is the pause menu preview. Resume the walkthrough or choose another step.</DialogDescription></DialogHeader><div className="pause-actions"><Button font="normal" onClick={() => setPauseOpen(false)}><Play data-icon="inline-start" />Resume preview</Button><Button variant="outline" font="normal" onClick={() => { setPauseOpen(false); dispatch({ type: "recalibrate" }); }}>Recalibrate</Button><Button variant="outline" font="normal" onClick={() => { setPauseOpen(false); dispatch({ type: "skip" }); }}>Skip movement</Button><Button variant="destructive" font="normal" onClick={stop}>End session</Button></div></DialogContent></Dialog>
  </div>;
}
