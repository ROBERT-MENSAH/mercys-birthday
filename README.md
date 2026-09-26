# Mercy's Birthday

A personalized birthday website for Mercy, built with real photographs and videos.

## Local preview

Requires Node.js 18 or newer.

```powershell
npm start
```

The site is served locally at `http://localhost:4173`. To rebuild the static files without starting the server, run `npm run build`; generated pages are written to `dist/`.

## Deploy

Vercel runs `npm run build` and serves the generated `dist/` directory. The site is also configured for deployment from the connected GitHub repository.
