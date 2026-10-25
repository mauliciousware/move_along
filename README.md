# Move Along

**A little movement. A lot more play.**

## Inspiration

People say AI will end humanity within 20-30 years. Instead of using AI for
destruction, I wanted to use code for wellness and fitness. So I built an app that
gets people to exercise through a game.

Since it's a game, it has a reward system that keeps the player motivated. You get
to play and take care of your body at the same time.

## What it does

Pick a movement, press play, and do your reps. Two rings tell you DOWN or UP.
Nothing leaves your device: no account, no upload, no saved video.

## How we built it

Next.js 16, React 19, TypeScript, and Tailwind v4. Pose tracking runs locally with
MediaPipe in a Web Worker.

We take the camera feed, calibrate, and track head and shoulder movement. Every
time the head completes a move, it counts as one point. A small reward system sits
on top, inspired by game libraries. We used an 8-bit style for the UI so it looks
appealing and not like AI slop.

## Challenges we ran into

The hardest part was calibrating whether the user is standing, sitting, or doing
push-ups. Getting the input from the device, going full screen, and adding the data
points were also tough. We used a machine learning model to recognize the head,
shoulders, and other body points.

## Accomplishments that we're proud of

A fully working two-exercise routine app. You can play a song in the background and
exercise to its rhythm.

## What we learned

Tracking is easy to show and hard to trust. Calibration is part of the product. Say
less.

## What's next for Move Along

More routines and multiplayer, so two people can do it *along* together and
challenge each other to a battle.

## AI Tools & Disclosure

We used OpenCode with the DeepSeek R1 model as an AI-assisted coding tool during
development. It helped with code generation, debugging, and implementation. The
project was built, integrated, and tested during CodeFest 2026.

## Run

Use Node 24 (`.nvmrc`) and npm:

```sh
npm ci
npm run dev
```


Open http://localhost:3000. To serve the production build, run `npm run build`
then `npm start`. No environment variables are needed by application code.

