# START HERE — Running OptiFlow on any machine

## The two errors you were hitting, explained

1. **`Error: Cannot find module '.../OptiFlow/dev'`**
   This happens when the app is started with `node dev`. That is wrong —
   `dev` is an npm script, not a file. **Always start with `npm run dev`.**

2. **Errors after unzipping on Windows**
   You were zipping the `node_modules` and `.next` folders. Those contain
   **native binaries compiled for macOS** (Next.js SWC + Tailwind's
   lightningcss). They cannot run on Windows. The fix is to **reinstall
   dependencies on each machine** — never copy `node_modules` between
   a Mac and a Windows PC.

---

## How to share the project (do this on the Mac)

Run this once to make a clean, portable zip (no Mac-only binaries):

```bash
bash make-zip.sh
```

It produces `OptiFlow.zip` in the folder above this one. Send **that** file.

> If you'd rather zip manually: select everything **except** `node_modules`,
> `.next`, and `.git`, then compress.

---

## How to run it after unzipping

### Prerequisites (install once per machine)
- **Node.js 20 or newer** — https://nodejs.org
- **MongoDB** running locally, or a MongoDB Atlas connection string.

### Windows
1. Unzip the folder.
2. Double-click **`setup.bat`** (or run it in a terminal).
3. When it finishes: `npm run dev`
4. Open http://localhost:3000

### Mac / Linux
1. Unzip the folder.
2. In a terminal in the project folder: `bash setup.sh`
3. Then: `npm run dev`
4. Open http://localhost:3000

---

## Environment variables

The app needs `.env.local`. If it's missing, `setup` copies `.env.example`
to `.env.local` for you — then open it and fill in at least:

- `MONGODB_URI` — your MongoDB connection string
- `JWT_SECRET` — any long random string
- `GEMINI_API_KEY` — only if you use the AI features

---

## Deploying (Vercel — recommended for Next.js)

1. Push the repo to GitHub.
2. Import it at https://vercel.com/new.
3. Add the same environment variables in the Vercel project settings.
4. Deploy. Vercel runs `npm install` and `npm run build` for you.

No code changes are needed — the project already builds cleanly
(`npm run build` succeeds with no errors).
