NIGHT SHIFT - MOBILE APK + ONLINE PLAY

IMPORTANT
- This is a prototype, not a finished commercial game.
- The APK build workflow creates a debug APK for testing.
- For online multiplayer from the APK, deploy this Node.js server to a public WebSocket-capable host first, then set public/server-config.js to the secure WebSocket URL, e.g. wss://YOUR-SERVICE.onrender.com, commit that change, and let GitHub Actions rebuild the APK.
- Browser play from the same server can leave public/server-config.js empty.
- Free hosting can sleep or have limits. No password/secret should be committed to the repository.

FILES
- server.js + public/: game server and web client
- render.yaml: Render service blueprint
- capacitor.config.json: Capacitor app settings
- .github/workflows/build-apk.yml: builds debug APK on pushes to main or manual run

BUILD
1. Upload all project files and folders to a GitHub repository (not just this ZIP).
2. Deploy the repository as a Web Service on Render, using the included render.yaml / Node settings.
3. Copy the deployed URL, change https:// to wss://, and put it into public/server-config.js as window.NIGHT_SHIFT_WS_URL.
4. Commit and push that change to main.
5. GitHub repo -> Actions -> Build NIGHT SHIFT APK -> open latest successful run -> Artifacts -> NIGHT-SHIFT-debug-APK -> download and extract app-debug.apk.
6. Install the APK on your Android phone. Android may ask to allow installation from that browser/file manager.
