// 零依赖本地预览服务器：直接托管 dist/ 静态产物
// 用法：npm run preview:local   然后打开 http://localhost:4321/
// 与 astro preview 的区别：这个不依赖 Vite，不会因为依赖缓存重建而失败
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(process.argv[2] || 'dist');
const port = Number(process.env.PORT || 4321);

const MIME = {
  html: 'text/html; charset=utf-8',
  htm: 'text/html; charset=utf-8',
  js: 'text/javascript; charset=utf-8',
  mjs: 'text/javascript; charset=utf-8',
  css: 'text/css; charset=utf-8',
  json: 'application/json; charset=utf-8',
  svg: 'image/svg+xml',
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  gif: 'image/gif',
  webp: 'image/webp',
  ico: 'image/x-icon',
  woff: 'font/woff',
  woff2: 'font/woff2',
  ttf: 'font/ttf',
  txt: 'text/plain; charset=utf-8',
  xml: 'application/xml; charset=utf-8',
};

if (!fs.existsSync(root)) {
  console.error(`找不到目录 ${root}，请先运行 npm run build`);
  process.exit(1);
}

const server = http.createServer((req, res) => {
  let rel;
  try {
    rel = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
  } catch {
    res.writeHead(400).end('bad request');
    return;
  }

  let file = path.join(root, rel);
  // 防目录穿越
  if (!file.startsWith(root)) {
    res.writeHead(403).end('forbidden');
    return;
  }

  if (fs.existsSync(file) && fs.statSync(file).isDirectory()) {
    file = path.join(file, 'index.html');
  }
  if (!fs.existsSync(file) && fs.existsSync(file + '.html')) {
    file += '.html';
  }
  if (!fs.existsSync(file)) {
    res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end('<meta charset="utf-8"><h1>404</h1><p>没有这个页面</p>');
    return;
  }

  const ext = path.extname(file).slice(1).toLowerCase();
  res.writeHead(200, {
    'Content-Type': MIME[ext] || 'application/octet-stream',
    'Cache-Control': 'no-cache',
  });
  fs.createReadStream(file).pipe(res);
});

server.listen(port, () => {
  console.log('');
  console.log('  白盒 · 本地预览已启动');
  console.log(`  http://localhost:${port}/`);
  console.log(`  服务目录：${root}`);
  console.log('  停止：Ctrl + C');
  console.log('');
});
