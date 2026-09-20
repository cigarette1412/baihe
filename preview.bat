@echo off
chcp 65001 >nul
cd /d %~dp0

if not exist "dist\index.html" (
  echo 首次运行，正在构建...
  call npm run build
)

echo 正在启动本地预览，浏览器打开 http://localhost:4321/
node tools\serve.mjs dist
pause
