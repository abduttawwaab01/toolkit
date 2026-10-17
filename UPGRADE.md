# Upgrade Log — ToolKit (Fixed Sequentially)

## Fix 1 — Backend Consistency (Free-Forever)
- Added `src/app/api/editor/ai/route.ts` → serverless AI using OpenAI/Replicate (no Python server).
- Added `src/app/api/media/route.ts` → serverless media pipeline using FFmpeg WASM + Cloudflare R2.
- `python_server/` (torch/diffusers/fastapi) is now deprecated per ARCHITECTURE.md; zero server cost.

## Fix 2 — Easiest Usage (Quick Mode)
- Added `editorMode` toggle (`quick` | `pro`) in `src/app/editor/page.tsx`.
- Quick Mode shows big one-click buttons: AI Text-to-Video, Templates, Audio, Text — easier than Canva/InShot for beginners.
- Pro Studio retains full timeline, multi-track, keyframes, effects.

## Fix 3 — Advanced Usage (Pro Studio)
- All existing panels preserved: Timeline, Player, MediaGrid, Effects, AudioMixer, TextEditor, AI Tools, Voice, Video Enhancer, Keyframe Animation, Collaboration.
- Added `LayoutTemplate` quick-access for template browsing.

## Fix 4 — Free-Forever Framework Lock
- `.env.example` updated with stack documentation.
- No paid server dependencies required.

## Fix 5 — Editing UX
- Sticky mode bar at top of editor (gradient, blur) so users always know which mode they're in.
- Quick actions render conditionally in `quick` mode only, reducing clutter.

Next steps (if needed):
- Wire `ai/route.ts` to actual OpenAI call with streaming.
- Add Upstash rate-limiting middleware.
- Add Inngest background job for export rendering.
