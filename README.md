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

## Push to a New GitHub Repository & Connect Zoho Domain (`soleystories`)

1. Create an empty repository on GitHub (e.g., `storysprout-studio`) at https://github.com/new.
2. Unzip `storysprout-studio-website.zip` into a folder and push:
   ```bash
   git init
   git add .
   git commit -m "Initial StorySprout Studio commit"
   git branch -M main
   git remote add origin https://github.com/<your-username>/storysprout-studio.git
   git push -u origin main
   ```
3. Deploy the repository on a Node host (Render, Railway, Fly.io, or a VPS with `ffmpeg`), then add your host's `CNAME` / `A` DNS records inside **Zoho Domains** for `soleystories` to point your domain to the studio.

## Publishing Approved Videos to `@RadiantSparkGlobal`

- Open the **Approval Queue** in the studio, click **Connect @RadiantSparkGlobal** to sign in with Google/YouTube OAuth, review each 1080p MP4 clip, click **Approve**, and click **Publish Approved** (or **Publish All Approved**).
- For automated 30-minute `:00` / `:30` queue checks outside the browser, run `storysprout-30min-worker.mjs` with your `YT_ACCESS_TOKEN`.
