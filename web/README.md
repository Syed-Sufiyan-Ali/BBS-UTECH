# BBSUTSD Campus Web App

Modern web port of the **BBSUTSD Campus** navigation platform built with:
- **React 19** + **TypeScript 5.8**
- **Vite 6** + **Tailwind CSS v4**
- **Leaflet 1.9** (Satellite & OpenStreetMap layers + Overpass API campus geometry)
- **Lucide React** + **Vitest**

## Run Locally
```bash
cd web
npm install
npm run dev
```

## Production Build & Tests
```bash
npm run typecheck
npm test
npm run build
```
Static production output is emitted to `web/dist/` and can be deployed directly to Vercel, Netlify, Cloudflare Pages, or GitHub Pages.
