# StorySprout Studio (@RadiantSparkGlobal)

Independent cinematic 3D kids animation studio, episode creator, 1080p FFmpeg MP4 renderer, human-approval publishing queue, and 30-minute queue check scheduler.

## Quick Start

1. Install dependencies (Node.js 18+ required, plus `ffmpeg` for 1080p MP4 encoding):
   ```bash
   npm install
   ```
2. Run locally on port 3000:
   ```bash
   npm run dev
   ```
3. Build & run for production:
   ```bash
   npm run build
   npm start
   ```

## Soleystories deployment

GitHub Pages serves the repository root at `https://soleystories.radiantsparkllc.com/`. After changing the app, run `bun install --frozen-lockfile` followed by `node scripts/build-pages.mjs`. Commit the generated root `index.html` and `pages-assets/` with the source changes. Vite uses `src/studio-entry.html` for development and Node builds.

The custom domain's static preview runs the browser UI and animation stage. Server features require an authenticated Node deployment with persistent storage and FFmpeg. Set `NODE_ENV=production` when running that deployment and keep provider credentials server-side.

## Publishing Approved Videos to `@RadiantSparkGlobal`

- Open the **Approval Queue** in the studio, click **Connect @RadiantSparkGlobal** to sign in with Google/YouTube OAuth, review each 1080p MP4 clip, click **Approve**, and click **Publish Approved** (or **Publish All Approved**).
- For automated 30-minute `:00` / `:30` queue checks outside the browser, run `storysprout-30min-worker.mjs` with your `YT_ACCESS_TOKEN`.
