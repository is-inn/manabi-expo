@echo off
chcp 65001 >nul
setlocal
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
  echo [ERROR] Node.js が見つかりません。https://nodejs.org からインストールしてください。
  pause & exit /b 1
)
if not exist node_modules (
  echo [SETUP] 初回セットアップ: 依存関係をインストールします（数分かかります）...
  call npm install
  if errorlevel 1 ( echo [ERROR] npm install に失敗しました & pause & exit /b 1 )
)
echo [START] テスト画面を起動します。ブラウザが自動で開きます。停止するには Ctrl+C。
call npx expo start --web
pause
