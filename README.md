# Edu Repo Ranker

GitHub is great at surfacing popular repos. It's bad at surfacing repos that actually teach you something. Stars measure hype, not pedagogy: a 40k-star project can be a nightmare to learn from, and a 200-star repo can be the clearest explanation of a concept you'll find anywhere.

This app fixes that for one query at a time. Type a topic, get back five repos ranked by how much you'd actually learn from reading them, each with a score and a reason.

Built at a hackathon around n8n and K2 Horizon.

## How it works

React + Vite frontend, talking to an n8n workflow that runs an LLM scoring pass over candidate repos and returns a ranked list.

```
POST https://adwa-m-1301.app.n8n.cloud/webhook/edu-scorer
{ "topic": "systems design" }

response: { "repos": [
    { "name": "owner/repo", "stars": 12345, "url": "...", "score": 9, "reason": "..." },
    ...
  ] }
```

The n8n workflow itself isn't part of this repo, this is just the client.

## Running it locally

```bash
npm install
npm run dev
```

Opens at `http://localhost:5173`.

Scoring runs on a shared LLM endpoint that gets hammered during hackathon judging, so a single request can take anywhere from 15 to 90 seconds. The loading state accounts for that: the message updates the longer it waits instead of sitting there looking stuck.

## Deploying

```bash
npm run build
```

outputs a static `dist/` folder, deployable anywhere (Vercel, Netlify, GitHub Pages). No server-side code, no env vars needed since the webhook URL is public and CORS-open.

## What's in the UI

- Search bar with a few quick-pick topics to skip typing
- Result cards: rank, score out of 10, star count, and the reasoning behind the score
- A loading state that doesn't panic during long waits
- Light and dark mode, matched to your system

## Why "educational value" instead of stars

Because stars answer "is this popular," and popularity isn't the question when you're trying to learn something. A repo scores well here for things like clear code, sane project structure, docs that explain *why* and not just *how*, and enough scope to be worth studying without being so large it's overwhelming.
