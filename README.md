# ClipFlow

An interactive click-through prototype of a "paste a YouTube link → get the
best moment as a clip → publish" app. Built with React + Vite.

Nothing here calls a real API — the video processing is a timed fake
animation, and "Publish to YouTube" doesn't actually publish anything. It's a
prototype for showing the intended user flow, not a working backend.

## Getting started

```bash
npm install
npm run dev
```

Then open the local URL Vite prints (usually http://localhost:5173).

## Project structure

```
src/
  App.jsx                     — top-level state machine (which step is active)
  App.css                     — all styling (plain CSS, no framework)
  main.jsx                    — React entry point
  components/
    BrowserChrome.jsx         — the fake browser-window frame
    Stepper.jsx                — the 4-step progress indicator at the top
    GoogleIcon.jsx            — inline Google "G" logo used in the login button
    stages/
      LoginStage.jsx
      ImportStage.jsx          — paste-a-URL screen
      ProcessingStage.jsx      — fake analysis animation
      ReviewStage.jsx          — pick a generated clip
      PublishStage.jsx         — edit title/description/thumbnail, publish
      DoneStage.jsx            — success screen
```

## Wiring in the real thing

Each stage component is presentational only — it just receives props/callbacks
from `App.jsx`. To make this functional you'd swap out:

- `LoginStage` → real OAuth (Google + YouTube scopes)
- `ImportStage` → an API call that kicks off video processing
- `ProcessingStage` → poll or subscribe to real job status instead of the
  timer-based fake sequence
- `ReviewStage` → real generated clip data (thumbnails, durations, titles)
  instead of the hardcoded `CLIPS` array
- `PublishStage` → the YouTube Data API's `videos.insert` call
