import express from 'express';

export function createMediaApp(contentDir: string) {
  const app = express();
  app.use((_req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    next();
  });
  app.use(
    express.static(contentDir, {
      acceptRanges: true,
      fallthrough: true,
      setHeaders(res, filePath) {
        if (filePath.endsWith('.m3u8')) {
          res.setHeader('Cache-Control', 'no-cache');
          res.setHeader('Content-Type', 'application/vnd.apple.mpegurl');
        } else {
          res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
          if (filePath.endsWith('.ts')) res.setHeader('Content-Type', 'video/mp2t');
        }
      },
    }),
  );
  return app;
}
